"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseYouTubeId } from "@/lib/live/youtube";

/* Admin content-management write path (S11 11-5). Every action re-checks the
   session + is_admin() server-side (defence in depth — file location and the
   client are never the access control; the authoritative gate is is_admin()
   INSIDE each 0023/0024 RPC). Inputs are zod-validated; failures map to neutral
   brand-voice copy and never expose a raw DB error. After a write we
   revalidate the affected admin screen plus the gated pages that read the
   content, so an edit shows up immediately.

   The S11 UI is edit-only for elements / academy / resources (no delete button),
   so no content-delete actions are wired here — the delete RPCs exist at the DB
   layer (0023) for completeness + re-ingest parity only. */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* PP6a (0029): the third and last layer of the 33-slot ceiling. An element slug
   was pinned to /^[a-k][1-3]$/ here, in the DB CHECK, AND inside
   admin_upsert_element — 11 letters x 3 = exactly 33 slots, all occupied. The
   other two came off in 0029; this one has to match or the migration changes
   nothing a form can reach. Same shape as the DB constraint, deliberately:
   lowercase kebab, 1-80 chars. */
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/i;

export type AdminContentState = { ok: boolean; message: string | null };

const GENERIC = "Something went wrong. Please try again.";
const EXPIRED = "Your session expired — sign in again.";

/* Empty / whitespace form fields -> undefined, so zod optionals don't see "". */
function field(formData: FormData, name: string): string | undefined {
  const v = formData.get(name);
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

type Guard =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; message: string };

/* Session + admin re-check, server-side, on every admin write. */
async function adminGuard(): Promise<Guard> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: EXPIRED };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return { ok: false, message: GENERIC };
  return { ok: true, supabase };
}

// ---------------------------------------------------------------------------
// Elements — save the topic guide (overview / simple guide / watch-out-for +
// metadata). The form round-trips the structural fields (code / focus area /
// sort order) so the upsert never loses them.
// ---------------------------------------------------------------------------
const elementSchema = z.object({
  slug: z.string().trim().regex(SLUG_RE).max(80),
  code: z.string().trim().min(1).max(16),
  /* Optional since 0029: the A–K focus-area vocabulary belongs to the OLD
     33-topic model. The 22 real focus areas have no A–K identity, and the DB
     now stores NULL rather than a fabricated code. The legacy 33 keep theirs
     and still round-trip through the hidden fields on the elements form. */
  focusAreaCode: z.string().trim().regex(/^[A-K]$/i).optional(),
  focusAreaName: z.string().trim().min(1).max(120).optional(),
  title: z.string().trim().min(1).max(200),
  oneLine: z.string().trim().max(500).optional(),
  overviewMd: z.string().max(100000).optional(),
  simpleGuideMd: z.string().max(100000).optional(),
  watchOutForMd: z.string().max(100000).optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
});

export async function saveElementAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = elementSchema.safeParse({
    slug: formData.get("slug"),
    code: formData.get("code"),
    /* field() maps "" -> undefined, so a focus area with no A–K code posts an
       empty hidden input and parses as absent rather than failing the regex. */
    focusAreaCode: field(formData, "focusAreaCode"),
    focusAreaName: field(formData, "focusAreaName"),
    title: formData.get("title"),
    oneLine: field(formData, "oneLine"),
    overviewMd: field(formData, "overviewMd"),
    simpleGuideMd: field(formData, "simpleGuideMd"),
    watchOutForMd: field(formData, "watchOutForMd"),
    sortOrder: field(formData, "sortOrder"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please add a title before saving." };
  }

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const d = parsed.data;
  const { error } = await guard.supabase.rpc("admin_upsert_element", {
    p_slug: d.slug.toLowerCase(),
    p_code: d.code,
    p_focus_area_code: d.focusAreaCode?.toUpperCase() ?? null,
    p_focus_area_name: d.focusAreaName ?? null,
    p_title: d.title,
    p_one_line: d.oneLine ?? null,
    p_overview_md: d.overviewMd ?? null,
    p_simple_guide_md: d.simpleGuideMd ?? null,
    p_watch_out_for_md: d.watchOutForMd ?? null,
    p_sort_order: d.sortOrder ?? 0,
  });
  if (error) return { ok: false, message: GENERIC };

  revalidatePath("/admin/content/elements");
  /* PP5 re-pointed these. An element's body now surfaces on exactly two kinds
     of page: the four toolkit sections (its summary card) and its own guide
     reader. The old targets — /plan, /food and the per-slug /elements/[slug] —
     are deleted routes, and revalidating a path that no longer exists is a
     silent no-op, which is the worst kind of stale.

     All four sections, because this action edits an `elements` row and never
     reads `platform_topics`, so it does not know which section the topic sits
     in. The reader is revalidated by ROUTE rather than by path for the same
     reason, and for a sharper one: its [topic] segment is the platform_topics
     slug, not this element's slug, so a path built from `d.slug` would match
     nothing and fail silently. */
  for (const section of ["setup", "operate", "program", "support"]) {
    revalidatePath(`/${section}`);
    revalidatePath(`/${section}/[topic]/guide`, "page");
  }
  return { ok: true, message: "Saved." };
}

// ---------------------------------------------------------------------------
// Pages (PP6a) — the hero copy for the About landing and the four toolkit
// pages. EDIT ONLY: platform_sections_slug_shape freezes the set to these five
// route segments, so the owner can never add or remove a page and a typo can
// never create a broken menu item. The RPC rejects an unknown slug outright.
//
// This is the screen that would have been a dead form: get_platform_sections()
// had ZERO call sites until PP6a wrapped it (getPlatformPages), so a Save here
// used to change nothing a partner could see.
// ---------------------------------------------------------------------------
const PAGE_SLUGS = ["about", "setup", "operate", "program", "support"] as const;

const platformSectionSchema = z.object({
  slug: z.enum(PAGE_SLUGS),
  label: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  eyebrow: z.string().trim().max(200).optional(),
  lead: z.string().trim().max(1000).optional(),
  heroImagePath: z.string().trim().max(300).optional(),
  heroPosition: z.string().trim().max(60).optional(),
  youtubeUrl: z.string().trim().max(500).optional(),
});

export async function savePlatformSectionAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = platformSectionSchema.safeParse({
    slug: formData.get("slug"),
    label: formData.get("label"),
    title: formData.get("title"),
    eyebrow: field(formData, "eyebrow"),
    lead: field(formData, "lead"),
    heroImagePath: field(formData, "heroImagePath"),
    heroPosition: field(formData, "heroPosition"),
    youtubeUrl: field(formData, "youtubeUrl"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fill in the page name and the heading before saving.",
    };
  }
  if (parsed.data.youtubeUrl && !parseYouTubeId(parsed.data.youtubeUrl)) {
    return {
      ok: false,
      message:
        "That doesn’t look like a YouTube link — paste a youtube.com or youtu.be URL.",
    };
  }

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const d = parsed.data;
  const { error } = await guard.supabase.rpc("admin_update_platform_section", {
    p_slug: d.slug,
    p_label: d.label,
    p_title: d.title,
    p_eyebrow: d.eyebrow ?? null,
    p_lead: d.lead ?? null,
    p_hero_image_path: d.heroImagePath ?? null,
    p_hero_position: d.heroPosition ?? null,
    p_youtube_url: d.youtubeUrl ?? null,
  });
  if (error) return { ok: false, message: GENERIC };

  /* The page itself, plus the reader, whose breadcrumb carries the page name.
     `about` is served at /dashboard — revalidating "/about" would be a silent
     no-op, which is the failure PP5 found in this very file. */
  revalidatePath("/admin/content/pages");
  revalidatePath(d.slug === "about" ? "/dashboard" : `/${d.slug}`);
  if (d.slug !== "about") {
    revalidatePath(`/${d.slug}/[topic]/guide`, "page");
  }
  return { ok: true, message: "Saved." };
}

// ---------------------------------------------------------------------------
// Resources — save template / booklet metadata only (the storage path and
// is_public are never editable; files change via the re-ingest path).
// ---------------------------------------------------------------------------
const resourceSchema = z.object({
  id: z.string().regex(UUID_RE),
  title: z.string().trim().min(1).max(300),
  type: z.enum(["form", "script", "log", "report", "approval", "guide", "booklet"]),
  focusAreaCode: z.string().trim().regex(/^[A-K]$/i).optional(),
  elementId: z.string().regex(UUID_RE).optional(),
  version: z.string().trim().max(40).optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
});

export async function saveResourceAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = resourceSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    type: formData.get("type"),
    focusAreaCode: field(formData, "focusAreaCode"),
    elementId: field(formData, "elementId"),
    version: field(formData, "version"),
    sortOrder: field(formData, "sortOrder"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please add a title and pick a type." };
  }

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const d = parsed.data;
  const { error } = await guard.supabase.rpc("admin_update_resource", {
    p_id: d.id,
    p_title: d.title,
    p_type: d.type,
    p_focus_area_code: d.focusAreaCode ? d.focusAreaCode.toUpperCase() : null,
    p_element_id: d.elementId ?? null,
    p_version: d.version ?? null,
    p_sort_order: d.sortOrder ?? null,
  });
  if (error) return { ok: false, message: GENERIC };

  /* /resources was the old library page, deleted at PP5. A template's metadata
     now shows in the templates grid on whichever focus area carries its
     element_id, so the four section pages replace it. */
  revalidatePath("/admin/content/resources");
  for (const section of ["setup", "operate", "program", "support"]) {
    revalidatePath(`/${section}`);
  }
  return { ok: true, message: "Saved." };
}

// ---------------------------------------------------------------------------
// Admins — add by email / remove (with the self + last-admin lockout guards).
// ---------------------------------------------------------------------------
const addAdminSchema = z.object({
  email: z.string().trim().email().max(254),
});

export async function addAdminAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = addAdminSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const { data, error } = await guard.supabase.rpc("admin_add_admin_by_email", {
    p_email: parsed.data.email,
  });
  if (error) {
    if (error.code === "P0002") {
      return {
        ok: false,
        message:
          "No account with that email yet — they need to apply or sign in first.",
      };
    }
    return { ok: false, message: GENERIC };
  }

  revalidatePath("/admin/content/admins");
  return {
    ok: true,
    message: data === true ? "Added." : "They’re already an admin.",
  };
}

export async function removeAdminAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const userId = field(formData, "userId");
  if (!userId || !UUID_RE.test(userId)) {
    return { ok: false, message: GENERIC };
  }

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const { data, error } = await guard.supabase.rpc("admin_remove_admin", {
    p_user_id: userId,
  });
  if (error) {
    if (error.message?.includes("yourself")) {
      return { ok: false, message: "You can’t remove your own admin access." };
    }
    if (error.message?.includes("last admin")) {
      return { ok: false, message: "There must be at least one admin." };
    }
    return { ok: false, message: GENERIC };
  }

  revalidatePath("/admin/content/admins");
  return {
    ok: true,
    message: data === true ? "Removed." : "They weren’t an admin.",
  };
}

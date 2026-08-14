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
// Focus areas (PP6a) — the main CMS screen. Replaces the old Elements screen,
// whose two editable bodies are dead: overview_md is dropped by PP7's 0031
// (D-PP-f removed the Overview card) and watch_out_for_md has had no consumer
// since PP3. The guide body moves here.
//
// Everything routes through admin_upsert_platform_topic, which writes BOTH
// tables in one transaction — platform_topics.element_id is NOT NULL + UNIQUE
// + FK, so a focus area does not exist without its elements row and a
// half-created one must be impossible.
//
// The DB raises short stable strings; this is the only place they become
// sentences. A raw 23505 or 23503 must never reach the owner's screen.
// ---------------------------------------------------------------------------

/* The owner never types a web address. The slug is derived from the title on
   CREATE and then frozen forever — admin_upsert_platform_topic ignores it on
   update, so a rename can never break a link a partner has bookmarked. */
function slugify(title: string): string {
  return title
    .normalize("NFKD")
    /* Drop the combining marks NFKD just split off, so "Café" -> "cafe" rather
       than "caf-". A Unicode property escape rather than a literal character
       range: the range would embed raw combining marks in the source, which is
       exactly the kind of thing an editor or a copy-paste silently mangles. */
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function focusAreaMessage(dbMessage: string | undefined): string {
  switch (dbMessage) {
    case "slug in use":
      return "Another focus area already uses that name. Try wording it slightly differently.";
    case "live focus area":
      return "This one is Live. Set it to Draft first, then delete it.";
    case "focus area has files":
      return "Remove its files first, then you can delete it.";
    case "unknown group":
      return "Choose a group for this focus area.";
    case "title is required":
      return "Please add a title before saving.";
    case "code is required":
      return "Please add a short code before saving.";
    default:
      return GENERIC;
  }
}

const focusAreaSchema = z.object({
  id: z.string().regex(UUID_RE).optional(),
  groupId: z.string().regex(UUID_RE),
  title: z.string().trim().min(1).max(200),
  code: z.string().trim().min(1).max(16),
  description: z.string().trim().max(500).optional(),
  intro: z.string().trim().max(1000).optional(),
  icon: z.string().trim().max(60).optional(),
  imagePath: z.string().trim().max(300).optional(),
  imagePosition: z.string().trim().max(60).optional(),
  youtubeUrl: z.string().trim().max(500).optional(),
  simpleGuideMd: z.string().max(100000).optional(),
});

/* Every section page a focus area can appear on, plus its reader route. The
   action does not know which section moved, and a stale toolkit page is worse
   than four cheap revalidations — the same reasoning the element save has
   carried since PP5. */
function revalidatePlatform() {
  revalidatePath("/admin/content/focus-areas");
  for (const section of ["setup", "operate", "program", "support"]) {
    revalidatePath(`/${section}`);
    revalidatePath(`/${section}/[topic]/guide`, "page");
  }
}

export async function saveFocusAreaAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = focusAreaSchema.safeParse({
    id: field(formData, "id"),
    groupId: formData.get("groupId"),
    title: formData.get("title"),
    code: formData.get("code"),
    description: field(formData, "description"),
    intro: field(formData, "intro"),
    icon: field(formData, "icon"),
    imagePath: field(formData, "imagePath"),
    imagePosition: field(formData, "imagePosition"),
    youtubeUrl: field(formData, "youtubeUrl"),
    /* Read RAW, not through field(): "" must survive as "" so the owner can
       clear the guide. field() maps "" to undefined, which the RPC reads as
       "not supplied" and leaves the old text in place — meaning an emptied
       textarea would silently come back. Found on TEST, 2026-08-14. */
    simpleGuideMd: formData.has("simpleGuideMd")
      ? String(formData.get("simpleGuideMd") ?? "")
      : undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please add a title and a short code before saving.",
    };
  }
  if (parsed.data.youtubeUrl && !parseYouTubeId(parsed.data.youtubeUrl)) {
    return {
      ok: false,
      message:
        "That doesn’t look like a YouTube link — paste a youtube.com or youtu.be URL.",
    };
  }

  const d = parsed.data;
  const slug = d.id ? undefined : slugify(d.title);
  if (!d.id && (!slug || !SLUG_RE.test(slug))) {
    return {
      ok: false,
      message:
        "That title doesn’t make a usable web address. Please include some letters or numbers.",
    };
  }

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const { error } = await guard.supabase.rpc("admin_upsert_platform_topic", {
    p_id: d.id ?? null,
    p_group_id: d.groupId,
    p_slug: slug ?? null,
    p_title: d.title,
    p_description: d.description ?? null,
    p_intro: d.intro ?? null,
    p_icon: d.icon ?? null,
    p_image_path: d.imagePath ?? null,
    p_image_position: d.imagePosition ?? null,
    p_youtube_url: d.youtubeUrl ?? null,
    p_sort_order: null,
    /* Never published by CREATE — rule 1 of the eight, and the reason a
       half-finished focus area can never reach a partner: no one outside HQ
       sees it until the owner deliberately switches it on. On UPDATE, null
       leaves the current state alone, so Save can never silently publish.

       (Wording note, PP6a: the word that belongs here is a Tailwind utility
       name, and Tailwind v4 scans the raw text of source files — using it in
       this comment added a real rule to the stylesheet every visitor
       downloads. Same mechanism PP4 found in docs/ and PP6a found in
       supabase/, but inside src/, which cannot be excluded. Caught by the
       rule-level bundle diff.) */
    p_published: null,
    p_element_code: d.code,
    /* undefined -> null (field absent, leave the body alone); "" stays ""
       (the owner cleared it, so clear it). */
    p_simple_guide_md: d.simpleGuideMd ?? null,
  });
  if (error) return { ok: false, message: focusAreaMessage(error.message) };

  revalidatePlatform();
  return { ok: true, message: "Saved." };
}

const publishSchema = z.object({
  id: z.string().regex(UUID_RE),
  published: z.enum(["true", "false"]),
});

export async function setFocusAreaPublishedAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = publishSchema.safeParse({
    id: formData.get("id"),
    published: formData.get("published"),
  });
  if (!parsed.success) return { ok: false, message: GENERIC };

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const live = parsed.data.published === "true";
  const { error } = await guard.supabase.rpc(
    "admin_set_platform_topic_published",
    { p_id: parsed.data.id, p_published: live },
  );
  if (error) return { ok: false, message: focusAreaMessage(error.message) };

  revalidatePlatform();
  return {
    ok: true,
    message: live
      ? "Live. Partners can see it now."
      : "Back to Draft. Partners can’t see it.",
  };
}

/* Delete asks the owner to type the name, and the form carries it so the check
   is re-done on the server — a confirmation that only exists in the browser is
   decoration. The DB refuses anyway if the row is Live or still has files. */
const deleteFocusAreaSchema = z.object({
  id: z.string().regex(UUID_RE),
  title: z.string().trim().min(1).max(200),
  confirm: z.string().trim().min(1).max(200),
});

export async function deleteFocusAreaAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = deleteFocusAreaSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { ok: false, message: GENERIC };
  if (
    parsed.data.confirm.toLowerCase() !== parsed.data.title.trim().toLowerCase()
  ) {
    return {
      ok: false,
      message: "The name didn’t match, so nothing was deleted.",
    };
  }

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const { error } = await guard.supabase.rpc("admin_delete_platform_topic", {
    p_id: parsed.data.id,
  });
  if (error) return { ok: false, message: focusAreaMessage(error.message) };

  revalidatePlatform();
  return { ok: true, message: "Deleted." };
}

const reorderSchema = z.object({ ids: z.array(z.string().regex(UUID_RE)).min(1) });

export async function reorderFocusAreasAction(
  ids: string[],
): Promise<AdminContentState> {
  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return { ok: false, message: GENERIC };

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const { error } = await guard.supabase.rpc("admin_reorder_platform_topics", {
    p_ids: parsed.data.ids,
  });
  if (error) return { ok: false, message: GENERIC };

  revalidatePlatform();
  return { ok: true, message: "Order saved." };
}

/* Groups exist so a section can be split if it ever grows. Under D-PP-n the new
   model is one group per section, rendered flat — so this is deliberately a
   single small action rather than a screen of its own. */
const groupSchema = z.object({
  sectionSlug: z.enum(PAGE_SLUGS),
  name: z.string().trim().min(1).max(200),
});

export async function createGroupAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = groupSchema.safeParse({
    sectionSlug: formData.get("sectionSlug"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please give the group a name." };
  }
  const slug = slugify(parsed.data.name);
  if (!slug || !SLUG_RE.test(slug)) {
    return { ok: false, message: "Please use some letters or numbers in the name." };
  }

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const { error } = await guard.supabase.rpc("admin_upsert_platform_group", {
    p_id: null,
    p_section_slug: parsed.data.sectionSlug,
    p_slug: slug,
    p_name: parsed.data.name,
    p_description: null,
    p_sort_order: 0,
    /* Live: a group is only a heading, and an unpublished group would hide every
       focus area the owner then puts in it — the opposite of helpful. Its
       topics are what stay Draft. */
    p_published: true,
  });
  if (error) {
    return {
      ok: false,
      message:
        error.message === "slug in use"
          ? "There is already a group with that name in this section."
          : GENERIC,
    };
  }

  revalidatePlatform();
  return { ok: true, message: "Group added." };
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

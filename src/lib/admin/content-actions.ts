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
  slug: z.string().trim().regex(/^[a-k][1-3]$/i),
  code: z.string().trim().min(1).max(16),
  focusAreaCode: z.string().trim().regex(/^[A-K]$/i),
  focusAreaName: z.string().trim().min(1).max(120),
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
    focusAreaCode: formData.get("focusAreaCode"),
    focusAreaName: formData.get("focusAreaName"),
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
    p_focus_area_code: d.focusAreaCode.toUpperCase(),
    p_focus_area_name: d.focusAreaName,
    p_title: d.title,
    p_one_line: d.oneLine ?? null,
    p_overview_md: d.overviewMd ?? null,
    p_simple_guide_md: d.simpleGuideMd ?? null,
    p_watch_out_for_md: d.watchOutForMd ?? null,
    p_sort_order: d.sortOrder ?? 0,
  });
  if (error) return { ok: false, message: GENERIC };

  revalidatePath("/admin/content/elements");
  revalidatePath(`/elements/${d.slug.toLowerCase()}`);
  revalidatePath("/plan");
  revalidatePath("/operate");
  revalidatePath("/food");
  revalidatePath("/program");
  return { ok: true, message: "Saved." };
}

// ---------------------------------------------------------------------------
// Academy — save a topic's video link + script. youtube_url is validated the
// same way the publish tool does (parseYouTubeId) before the RPC.
// ---------------------------------------------------------------------------
const academySchema = z.object({
  elementId: z.string().regex(UUID_RE),
  elementSlug: z.string().trim().regex(/^[a-k][1-3]$/i).optional(),
  title: z.string().trim().min(1).max(200),
  oneLine: z.string().trim().max(500).optional(),
  length: z.string().trim().max(60).optional(),
  youtubeUrl: z.string().trim().max(500).optional(),
  bodyMd: z.string().max(100000).optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
});

export async function saveAcademyModuleAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = academySchema.safeParse({
    elementId: formData.get("elementId"),
    elementSlug: field(formData, "elementSlug"),
    title: formData.get("title"),
    oneLine: field(formData, "oneLine"),
    length: field(formData, "length"),
    youtubeUrl: field(formData, "youtubeUrl"),
    bodyMd: field(formData, "bodyMd"),
    sortOrder: field(formData, "sortOrder"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please add a title before saving." };
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
  const { error } = await guard.supabase.rpc("admin_upsert_academy_module", {
    p_element_id: d.elementId,
    p_title: d.title,
    p_one_line: d.oneLine ?? null,
    p_length: d.length ?? null,
    p_youtube_url: d.youtubeUrl ?? null,
    p_body_md: d.bodyMd ?? null,
    p_sort_order: d.sortOrder ?? 0,
  });
  if (error) return { ok: false, message: GENERIC };

  revalidatePath("/admin/content/academy");
  revalidatePath("/academy");
  if (d.elementSlug) revalidatePath(`/elements/${d.elementSlug.toLowerCase()}`);
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

  revalidatePath("/admin/content/resources");
  revalidatePath("/resources");
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

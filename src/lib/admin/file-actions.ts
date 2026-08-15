"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AdminContentState } from "./content-actions";

/* Admin file lifecycle (PP6a, 6a-g) — the upload path the platform has never
   had. Kept out of content-actions.ts because a file is two things, not one,
   and the ordering between them is the whole design.

   POSTURE, unchanged from every other admin write:
     - the USER'S OWN session client, never a service key. Uploads work because
       0029 added is_admin() INSERT/UPDATE/DELETE policies on storage.objects
       for the private bucket; a non-admin is denied at the storage layer AND at
       the RPC, so this fails closed twice.
     - every action re-checks the session and is_admin() server-side.
     - the storage path is COMPUTED HERE, from an element slug looked up
       server-side. The browser never proposes a path, and 0029 re-validates the
       shape anyway (no leading slash, no traversal, no scheme).
     - is_public and the bucket are not parameters of the RPC at all: they are
       forced, so no upload can publish a template or point it elsewhere.

   THE COMPENSATION CONTRACT (0029's header states the same thing in SQL):
     UPLOAD   object first, then register. If the RPC fails, delete the object
              we just wrote. Residue: none.
     REPLACE  new object first, then repoint the row — the RPC hands back the
              OLD key to delete. If the RPC fails, delete the NEW object; the
              row still points at the old one. Residue: none.
     DELETE   ROW first, then the object, using the key the RPC returns. An
              orphaned OBJECT is inert — signed URLs are minted only from
              resources rows, so with no row there is no id, no URL and no
              reachable file. The other order would leave a partner a Download
              button that fails. Residue: at worst unreferenced bytes. */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GENERIC = "Something went wrong. Please try again.";
const EXPIRED = "Your session expired — sign in again.";
const BUCKET = "resources";

/* Word documents and PDFs only. These are working templates a partner fills
   in, so the editable format is the point (D-PP-l) — but a PDF guide is
   legitimate, so both are allowed and nothing else is. */
const ALLOWED = new Map<string, string>([
  [
    "docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ["pdf", "application/pdf"],
]);

/* 4 MB.
   THREE limits have to agree, not two — corrected at the PP6a exit gate after
   the review pointed out the third:
     - this one, which produces a sentence the owner can act on;
     - next.config.ts serverActions.bodySizeLimit, which must exceed it to cover
       multipart overhead (set to 4.5mb);
     - and the DEPLOY TARGET. Vercel rejects a serverless function request body
       over ~4.5 MB with a 413 before our code runs at all, and
       bodySizeLimit cannot raise a platform edge limit. A 10 MB limit here
       would have promised something the host refuses, and the owner would have
       met a framework error instead of a sentence — exactly what the original
       comment said it was preventing.
   The delivered content is 183–188 KB per file, so 4 MB is ~20x headroom. If a
   genuinely large file is ever needed, the fix is a direct-to-storage signed
   upload URL, which never passes through a function body at all. */
const MAX_BYTES = 4 * 1024 * 1024;

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  /* trim(): a trailing space in a filename — allowed by OneDrive and Windows —
     otherwise yields "docx " and is rejected by an otherwise correct check. */
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase().trim();
}

type Checked = { ok: true; ext: string } | { ok: false; message: string };

/* Checked before anything is sent anywhere. The screen checks the same two
   things first so the owner is told immediately, but this is the one that
   counts. */
function checkFile(file: File | null): Checked {
  if (!file || file.size === 0) {
    return { ok: false, message: "Choose a file first." };
  }
  const ext = extensionOf(file.name);
  if (!ALLOWED.has(ext)) {
    /* Name what arrived, not only what is allowed. The old wording gave the
       owner nothing to act on when he met it on his first real upload — and a
       .doc is indistinguishable from a .docx in a picker with extensions
       hidden. Mirrored in files-admin.tsx so both layers say the same thing. */
    return {
      ok: false,
      message: ext
        ? `That’s a .${ext} file. Please save it as .docx or a PDF and upload it again.`
        : "That file doesn’t have a file type in its name. Please save it as .docx or a PDF and upload it again.",
    };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      message: "That file is over 4 MB. Please save a smaller version.",
    };
  }
  return { ok: true, ext };
}

type Guard =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; message: string };

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

/* The element slug is resolved SERVER-SIDE from the id, never taken from the
   form — it is half of the storage path, and a path the browser can influence
   is a path the browser can escape from. */
async function elementSlugFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  elementId: string,
): Promise<string | null> {
  const { data } = await supabase.rpc("admin_list_platform_topics");
  const rows = (data as { element_id: string; element_slug: string }[] | null) ?? [];
  return rows.find((r) => r.element_id === elementId)?.element_slug ?? null;
}

/* A readable stem plus a short unique tail. The tail exists because
   resources_storage_key is UNIQUE (bucket, path): without it, replacing a file
   with a same-named one would collide, and a rename would need the object moved
   to stay tidy. With it, "file already registered" only ever means what it
   says — a second guide on one focus area. */
function objectKey(
  elementSlug: string,
  prefix: string,
  title: string,
  ext: string,
): string {
  const stem = slugify(title) || "file";
  const tail = Date.now().toString(36);
  return `${elementSlug}/${prefix}-${stem}-${tail}.${ext}`;
}

function fileMessage(dbMessage: string | undefined): string {
  switch (dbMessage) {
    case "file already registered":
      return "There is already a guide file on this focus area. Replace it instead of adding a second one.";
    case "code is required":
      return "Please give the template a short code, like T01.";
    case "unknown file":
      return "The name didn’t match, so nothing was deleted. If it was renamed recently, reload the page.";
    case "unknown focus area":
      return "That focus area no longer exists — reload the page.";
    case "invalid storage path":
    case "invalid file kind":
      return GENERIC;
    case "title is required":
      return "Please give the file a name before uploading.";
    default:
      return GENERIC;
  }
}

function revalidateFiles() {
  revalidatePath("/admin/content/files");
  revalidatePath("/admin/content/focus-areas");
  for (const section of ["setup", "operate", "program", "support"]) {
    revalidatePath(`/${section}`);
    revalidatePath(`/${section}/[topic]/guide`, "page");
  }
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------
const uploadSchema = z.object({
  elementId: z.string().regex(UUID_RE),
  kind: z.enum(["guide", "template"]),
  title: z.string().trim().min(1).max(300),
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,15}$/)
    .optional(),
});

export async function uploadFileAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = uploadSchema.safeParse({
    elementId: formData.get("elementId"),
    kind: formData.get("kind"),
    title: formData.get("title"),
    code: (formData.get("code") as string | null)?.trim() || undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: "Please give the file a name before uploading." };
  }
  const d = parsed.data;
  if (d.kind === "template" && !d.code) {
    return { ok: false, message: "Please give the template a short code, like T01." };
  }

  const file = formData.get("file");
  const checked = checkFile(file instanceof File ? file : null);
  if (!checked.ok) return { ok: false, message: checked.message };

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const elementSlug = await elementSlugFor(guard.supabase, d.elementId);
  if (!elementSlug) return { ok: false, message: GENERIC };

  /* slugify the code, exactly as the replace path does. Raw, it is part of a
     storage key: a code containing "../" would climb out of the focus-area
     folder, 0029's path check would then reject the registration, and the
     compensating remove() would use the un-normalised key and match nothing —
     orphaned bytes with no row. Found by the PP6a exit-gate review. */
  const path = objectKey(
    elementSlug,
    d.kind === "guide" ? "guide" : slugify(d.code as string) || "file",
    d.title,
    checked.ext,
  );

  // 1) the object
  const { error: upErr } = await guard.supabase.storage
    .from(BUCKET)
    .upload(path, file as File, {
      contentType: ALLOWED.get(checked.ext),
      upsert: false,
    });
  if (upErr) return { ok: false, message: GENERIC };

  // 2) the row — and if it fails, take the object back out again
  const { error: rpcErr } = await guard.supabase.rpc(
    "admin_register_resource_file",
    {
      p_element_id: d.elementId,
      p_storage_path: path,
      p_title: d.title,
      p_doc_key: d.kind === "guide" ? "guide" : null,
      p_code: d.kind === "guide" ? null : d.code,
      p_type: d.kind === "guide" ? "guide" : "form",
      p_version: null,
      p_sort_order: 0,
    },
  );
  if (rpcErr) {
    await guard.supabase.storage.from(BUCKET).remove([path]);
    return { ok: false, message: fileMessage(rpcErr.message) };
  }

  revalidateFiles();
  return { ok: true, message: "Uploaded." };
}

// ---------------------------------------------------------------------------
// Replace
// ---------------------------------------------------------------------------
const replaceSchema = z.object({
  id: z.string().regex(UUID_RE),
  elementId: z.string().regex(UUID_RE),
  title: z.string().trim().min(1).max(300),
  prefix: z.string().trim().min(1).max(20),
});

export async function replaceFileAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = replaceSchema.safeParse({
    id: formData.get("id"),
    elementId: formData.get("elementId"),
    title: formData.get("title"),
    prefix: formData.get("prefix"),
  });
  if (!parsed.success) return { ok: false, message: GENERIC };

  const file = formData.get("file");
  const checked = checkFile(file instanceof File ? file : null);
  if (!checked.ok) return { ok: false, message: checked.message };

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const elementSlug = await elementSlugFor(guard.supabase, parsed.data.elementId);
  if (!elementSlug) return { ok: false, message: GENERIC };

  const path = objectKey(
    elementSlug,
    slugify(parsed.data.prefix) || "file",
    parsed.data.title,
    checked.ext,
  );

  // 1) the new object
  const { error: upErr } = await guard.supabase.storage
    .from(BUCKET)
    .upload(path, file as File, {
      contentType: ALLOWED.get(checked.ext),
      upsert: false,
    });
  if (upErr) return { ok: false, message: GENERIC };

  // 2) repoint the row; it returns the key of the file we just replaced
  /* p_element_id is matched against the row INSIDE the RPC, not merely sent
     alongside it. The two used to be independent client-controlled fields, so
     one focus area's element id with another's file id repointed the wrong row
     at freshly uploaded bytes. Found by the independent review, 2026-08-14. */
  const { data, error: rpcErr } = await guard.supabase.rpc(
    "admin_replace_resource_file",
    {
      p_id: parsed.data.id,
      p_element_id: parsed.data.elementId,
      p_storage_path: path,
    },
  );
  if (rpcErr) {
    /* The row still points at the old object, so the old file keeps working —
       take the new one back out. */
    await guard.supabase.storage.from(BUCKET).remove([path]);
    return { ok: false, message: fileMessage(rpcErr.message) };
  }

  // 3) the object we replaced, now unreferenced
  const oldPath = typeof data === "string" ? data : null;
  if (oldPath && oldPath !== path) {
    await guard.supabase.storage.from(BUCKET).remove([oldPath]);
  }

  revalidateFiles();
  return { ok: true, message: "Replaced." };
}

// ---------------------------------------------------------------------------
// Rename / re-badge
// ---------------------------------------------------------------------------
const renameSchema = z.object({
  id: z.string().regex(UUID_RE),
  title: z.string().trim().min(1).max(300),
  code: z.string().trim().max(16).optional(),
});

export async function renameFileAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = renameSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    code: (formData.get("code") as string | null)?.trim() || undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: "Please give the file a name." };
  }

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  /* Metadata only. The stored object is not moved: renaming a file must never
     change where its bytes live, for the same reason renaming a focus area
     must never change its web address. */
  const { error } = await guard.supabase.rpc("admin_update_resource_meta", {
    p_id: parsed.data.id,
    p_title: parsed.data.title,
    p_code: parsed.data.code ?? null,
    p_type: null,
    p_version: null,
    p_sort_order: null,
  });
  if (error) return { ok: false, message: fileMessage(error.message) };

  revalidateFiles();
  return { ok: true, message: "Saved." };
}

// ---------------------------------------------------------------------------
// Delete — row first, then the object
// ---------------------------------------------------------------------------
const deleteSchema = z.object({
  id: z.string().regex(UUID_RE),
  title: z.string().trim().min(1).max(300),
  confirm: z.string().trim().min(1).max(300),
});

export async function deleteFileAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = deleteSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { ok: false, message: GENERIC };

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  /* The typed name goes to the DATABASE, which compares it against the row it
     is about to delete, in the same statement. Comparing here against a title
     the form was rendered with lets a stale tab confirm a name that has since
     changed. Found by the independent review, 2026-08-14. */
  const { data, error } = await guard.supabase.rpc("admin_delete_resource_file", {
    p_id: parsed.data.id,
    p_confirm_title: parsed.data.confirm,
  });
  if (error) return { ok: false, message: fileMessage(error.message) };

  const row = ((data as { storage_bucket: string; storage_path: string }[] | null) ??
    [])[0];
  if (row?.storage_path) {
    /* Best effort, and deliberately not fatal: the row is already gone, so the
       file is unreachable either way. A failure here leaves unreferenced bytes,
       which the PROD verification script lists. */
    await guard.supabase.storage.from(row.storage_bucket).remove([row.storage_path]);
  }

  revalidateFiles();
  return { ok: true, message: "Deleted." };
}

// ---------------------------------------------------------------------------
// Reorder
// ---------------------------------------------------------------------------
export async function reorderFilesAction(
  ids: string[],
): Promise<AdminContentState> {
  const parsed = z.array(z.string().regex(UUID_RE)).min(1).safeParse(ids);
  if (!parsed.success) return { ok: false, message: GENERIC };

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const { error } = await guard.supabase.rpc("admin_reorder_resource_files", {
    p_ids: parsed.data,
  });
  if (error) return { ok: false, message: GENERIC };

  revalidateFiles();
  return { ok: true, message: "Order saved." };
}

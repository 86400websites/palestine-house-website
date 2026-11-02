"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  fileKindOf,
  OVERVIEW_CODE,
  SHARED_RESOURCES,
  type PwFileKind,
} from "@/lib/workspace-v2/shared-resources";
import { checkSvgSafety, isPng } from "./file-safety";
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

/* Word documents, plus the two formats CR1's delivery added: the logo PNG and the
   editable SVG layouts. These are working files a partner adapts, so the editable
   format is the point (D-PP-l). A PDF was allowed here until CR1, which made a row's
   code decide its download label: the copy has no label for one, so it would have
   been offered as a Word file. Nothing else is allowed. */
const ALLOWED = new Map<string, string>([
  [
    "docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ["png", "image/png"],
  ["svg", "image/svg+xml"],
]);

/* A row's code decides its download label (shared-resources.ts), so a format has to
   arrive under a code that will describe it truthfully. */
const KIND_OF_EXT: Record<string, PwFileKind> = {
  docx: "word",
  png: "logo",
  svg: "layout",
};

const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,15}$/;
const CODE_MISMATCH =
  "That file doesn’t match its code. A PNG needs the code LOGO, an SVG a code like SVG-1, and a Word file a code like T01.";

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
        ? `That’s a .${ext} file. Please save it as .docx, a PNG or an SVG and upload it again.`
        : "That file doesn’t have a file type in its name. Please save it as .docx, a PNG or an SVG and upload it again.",
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

/* The checks a file name cannot answer, before any byte is stored. A partner may
   open a downloaded SVG in a browser, so one carrying anything active or external is
   refused, within what file-safety.ts says it can catch, and never edited to make it
   pass. Returns the message to show, or null when the file is fine. */
async function checkContents(
  file: File,
  ext: string,
  code: string | null,
): Promise<string | null> {
  if (KIND_OF_EXT[ext] !== fileKindOf(code)) return CODE_MISMATCH;
  if (ext === "png" && !isPng(new Uint8Array(await file.arrayBuffer()))) {
    return "That file isn’t a real PNG. Please export it again.";
  }
  if (ext === "svg") {
    const [problem] = checkSvgSafety(await file.text());
    if (problem) return `That SVG can’t be stored: it has ${problem}. Please export it again without that.`;
  }
  return null;
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

/* A row's code is more than a badge. It decides the row's label, whether it is
   listed and counted among the templates, and how another focus area finds it
   (shared-resources.ts), and the database will store any code it is handed. So a new
   or changed code is checked against the focus area's rows first. `id` is the row
   being re-badged, or null for an upload. Returns the message to show, or null. */
async function checkCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  elementId: string,
  id: string | null,
  code: string,
): Promise<string | null> {
  const [
    { data: files, error: filesError },
    { data: topics, error: topicsError },
  ] = await Promise.all([
    supabase.rpc("admin_list_resource_files", { p_element_id: elementId }),
    supabase.rpc("admin_list_platform_topics"),
  ]);
  if (filesError || topicsError) return GENERIC;
  const rows = (files as { id: string; code: string | null }[] | null) ?? [];
  const current = rows.find((r) => r.id === id);
  if (id && !current) return "That file is no longer here. Please reload the page.";
  if (current?.code === code) return null;

  if (current?.code === OVERVIEW_CODE) {
    return "This file is the focus area’s Overview, so its code stays OV.";
  }
  if (rows.some((r) => r.code === code)) {
    return code === OVERVIEW_CODE
      ? "This focus area already has its Overview."
      : `This focus area already has a file with the code ${code}. Please choose another.`;
  }
  if (!current) return null;
  if (fileKindOf(current.code) !== fileKindOf(code)) return CODE_MISMATCH;

  const slug = (
    (topics as { element_id: string; slug: string }[] | null) ?? []
  ).find((t) => t.element_id === elementId)?.slug;
  const borrowed = Object.values(SHARED_RESOURCES).some((refs) =>
    refs.some((r) => r.topicSlug === slug && r.code === current.code),
  );
  return borrowed
    ? "Other focus areas link to this file by its code, so the code has to stay."
    : null;
}

/* <focus area>/<unique folder>/<the uploaded file's own name>.

   The unique folder exists because resources_storage_key is UNIQUE (bucket, path):
   without it, replacing a file with a same-named one would collide. With it, "file
   already registered" only ever means what it says — a second guide on one focus
   area. The LAST segment is what getResourceDownloadUrl names the download, so a
   partner saves the file under the name the owner gave it (CR1), not under a key
   with a suffix. The name comes from the browser, so it is reduced to a safe set of
   characters first; 0029 re-validates the shape anyway. Parentheses are out because a
   browser saves them as %28 and %29. */
function objectKey(elementSlug: string, fileName: string, ext: string): string {
  const stem = fileName
    .slice(0, fileName.lastIndexOf("."))
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-z0-9 _-]+/g, "-")
    .replace(/^[\s-]+|[\s-]+$/g, "")
    .slice(0, 120)
    .trimEnd();
  const folder = Date.now().toString(36);
  return `${elementSlug}/${folder}/${stem || "file"}.${ext}`;
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
  code: z.string().trim().regex(CODE_RE).optional(),
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

  const code = d.kind === "guide" ? null : (d.code as string).toUpperCase();
  const refused =
    (await checkContents(file as File, checked.ext, code)) ??
    (code ? await checkCode(guard.supabase, d.elementId, null, code) : null);
  if (refused) return { ok: false, message: refused };

  const elementSlug = await elementSlugFor(guard.supabase, d.elementId);
  if (!elementSlug) return { ok: false, message: GENERIC };

  /* Built from the file's own name, never from the code: a code containing "../"
     once climbed out of the focus-area folder here, 0029's path check then rejected
     the registration, and the compensating remove() matched nothing — orphaned
     bytes with no row. Found by the PP6a exit-gate review. */
  const path = objectKey(elementSlug, (file as File).name, checked.ext);

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

  const refused = await checkContents(
    file as File,
    checked.ext,
    parsed.data.prefix.toUpperCase(),
  );
  if (refused) return { ok: false, message: refused };

  const elementSlug = await elementSlugFor(guard.supabase, parsed.data.elementId);
  if (!elementSlug) return { ok: false, message: GENERIC };

  const path = objectKey(elementSlug, (file as File).name, checked.ext);

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
  elementId: z.string().regex(UUID_RE),
  title: z.string().trim().min(1).max(300),
  code: z.string().trim().regex(CODE_RE).optional(),
});

export async function renameFileAction(
  _prev: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const parsed = renameSchema.safeParse({
    id: formData.get("id"),
    elementId: formData.get("elementId"),
    title: formData.get("title"),
    code: (formData.get("code") as string | null)?.trim() || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message:
        "Please give the file a name, and a short code of letters, numbers and dashes.",
    };
  }

  const guard = await adminGuard();
  if (!guard.ok) return { ok: false, message: guard.message };

  const code = parsed.data.code?.toUpperCase();
  const refused = code
    ? await checkCode(guard.supabase, parsed.data.elementId, parsed.data.id, code)
    : null;
  if (refused) return { ok: false, message: refused };

  /* Metadata only. The stored object is not moved: renaming a file must never
     change where its bytes live, for the same reason renaming a focus area
     must never change its web address. */
  const { error } = await guard.supabase.rpc("admin_update_resource_meta", {
    p_id: parsed.data.id,
    p_title: parsed.data.title,
    p_code: code ?? null,
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

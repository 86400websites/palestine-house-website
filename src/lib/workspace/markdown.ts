import "server-only";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/* Server-only Markdown → sanitized HTML for the DB-sourced element bodies (S6).
   The bodies are HQ-authored but still untrusted at render time, so we render
   with marked (GFM: tables, lists, headings) then scrub the output through a
   tight sanitize-html allow-list. `breaks: true` keeps the single-newline line
   breaks the ingested DOCX content relies on. Never inject raw DB markup
   without passing it through here. */

marked.setOptions({ gfm: true, breaks: true });

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "hr",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "code",
    "pre",
    "ul",
    "ol",
    "li",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "a",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    th: ["align", "colspan", "rowspan"],
    td: ["align", "colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  // Drop disallowed tags (keeping their text); script/style content is removed.
  disallowedTagsMode: "discard",
  transformTags: {
    // The page owns the single <h1>; demote any body H1 so there is only one.
    h1: "h2",
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" },
    }),
  },
};

export function renderMarkdown(md: string | null | undefined): string {
  if (!md || !md.trim()) return "";
  const rawHtml = marked.parse(md) as string;
  return sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
}

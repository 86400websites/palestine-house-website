/* Checks on the two non-document formats the private library holds since CR1: the
   logo (PNG) and the editable social layouts (SVG). Pure and dependency-free, so
   the CMS upload path and scripts/cr1-extract.ts apply one set of rules.

   These files are only ever served as attachment downloads from the private bucket
   and their markup is never injected into a page. The SVG check is still strict,
   because an SVG can carry script and a partner may open a saved one in a browser:
   anything active or anything that would fetch from elsewhere is refused, and the
   bytes are never edited to make them pass.

   It is a check on what a design tool exports or a careless file carries, not a
   sanitizer proven against a determined author: it reads text, with no XML parser in
   this project to lean on. It refuses the known ways of getting past it (another
   encoding, a namespace prefix, escapes), which scripts/verify-svg-safety.ts holds as
   cases, and uploads stay limited to admins. */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function isPng(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((b, i) => bytes[i] === b);
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
/* Design tools declare this one for ordinary internal references. It names a standard;
   nothing is fetched from it. */
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";

/* Character references read as what they mean, so `http&#58;//` and `&#117;rl(` meet the
   same checks as the plain spelling, and an editor's `url(&quot;#a&quot;)` is an internal
   reference. One pass: a browser decodes once, so `&#x26;#35;` is not a `#` to it either. */
function decodeCharacterReferences(text: string): string {
  return text.replace(/&(?:#x([0-9a-f]+)|#([0-9]+)|(quot|apos));?/gi, (_, hex?: string, dec?: string, name?: string) => {
    if (name) return name.toLowerCase() === "quot" ? '"' : "'";
    const code = hex ? parseInt(hex, 16) : parseInt(dec as string, 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  });
}

/* By hand rather than by a pattern, because a file full of unclosed comment openers would
   make a pattern quadratic, and a file up to 4 MB must not make anything here slow. */
function withoutComments(text: string): string {
  let out = "";
  let from = 0;
  for (;;) {
    const open = text.indexOf("<!--", from);
    if (open < 0) return out + text.slice(from);
    out += text.slice(from, open);
    const close = text.indexOf("-->", open + 4);
    if (close < 0) return out;
    from = close + 3;
  }
}

/* Returns what is wrong, so a refusal can say why. An empty list means it passed. */
export function checkSvgSafety(raw: string): string[] {
  const problems: string[] = [];
  /* This view is UTF-8. A UTF-16 or ISO-2022-JP file shows up here as NUL and ESC
     bytes around markup these checks would not recognise, and any other legacy
     encoding as replacement characters. */
  if (/[\u{0}\u{1B}\u{FFFD}]/u.test(raw)) problems.push("an encoding other than plain UTF-8");
  /* A browser reads the whole head up to the first ">" and takes any "encoding" in it,
     even inside a longer word or another instruction. */
  const head = raw.slice(0, raw.indexOf(">") + 1);
  if (/<\?xml/i.test(head) && /encoding/i.test(head.replace(/\bencoding\s*=\s*["']utf-?8["']/gi, ""))) {
    problems.push("an encoding other than plain UTF-8");
  }

  const text = decodeCharacterReferences(raw);
  if (!/<svg\b/i.test(text)) problems.push("no <svg> root element");
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) problems.push("a DOCTYPE or entity declaration");
  if (/<\?xml-stylesheet/i.test(text)) problems.push("a stylesheet instruction");
  if (/<script\b/i.test(text)) problems.push("a script element");
  if (/<(foreignObject|iframe|embed|object|audio|video)\b/i.test(text)) {
    problems.push("an embedded document or media element");
  }
  if (/<(animate|animateTransform|animateMotion|set)\b/i.test(text)) {
    problems.push("an animation element");
  }
  if (/\son[a-z]+\s*=/i.test(text)) problems.push("an event-handler attribute");
  if (/javascript\s*:/i.test(text)) problems.push("a javascript: URL");
  if (/@import/i.test(text)) problems.push("a CSS @import");
  if (/\s(src|srcset|ping|data|xml:base)\s*=/i.test(text)) problems.push("an attribute that loads something");
  if (/(image-set|\bsrc)\s*\(/i.test(text)) problems.push("a CSS function that loads something");

  /* A prefix can bind a script element to the SVG namespace where the checks above would
     not see it, and another default namespace can make it an HTML script. So one namespace,
     plus xlink: take away the two allowed declarations, and any declaration left is
     refused, however long or oddly spelled its prefix. The test stays narrow on purpose:
     a bare "xmlns" also turns up by chance inside embedded base64 images. */
  const undeclared = raw
    .replace(/\bxmlns\s*=\s*(?:"http:\/\/www\.w3\.org\/2000\/svg"|'http:\/\/www\.w3\.org\/2000\/svg')/g, "")
    .replace(/\bxmlns:xlink\s*=\s*(?:"http:\/\/www\.w3\.org\/1999\/xlink"|'http:\/\/www\.w3\.org\/1999\/xlink')/g, "");
  if (/xmlns\s*[:=]/i.test(undeclared)) problems.push("a namespace other than SVG and xlink");

  /* A presentation attribute is CSS too, so a backslash anywhere could hide a url(). */
  if (text.includes("\\")) problems.push("a backslash, which CSS reads as an escape");
  /* A style block is read as its text children joined, so a comment, a CDATA boundary or a
     child element inside one can split a token. One piece of text only. The start tag is
     read attribute by attribute, so a "/>" inside a quoted value cannot pass for its end.
     No "&" in CDATA, where a browser does not decode what the check above decoded. */
  const styleTags = raw.match(/<style\b/gi)?.length ?? 0;
  const plainStyles =
    raw.match(
      /<style\b(?:\s+[^\s=<>"'/]+\s*=\s*(?:"[^"<>]*"|'[^'<>]*'))*\s*(?:\/>|>(?:[^<]*|\s*<!\[CDATA\[[^\]&<]*\]\]>\s*)<\/style\s*>)/gi,
    )?.length ?? 0;
  if (styleTags !== plainStyles) problems.push("a style block with markup inside it");

  /* Every reference must stay inside the file: a fragment or an embedded image. Each
     match looks ahead rather than consumes, so a decoy in a title or a comment cannot
     swallow the real attribute after it. Only ASCII spaces are skipped, because those
     are all a URL parser skips. */
  for (const match of text.matchAll(/\b(?:xlink:)?href\s*=\s*(?=(?:"([^"]*)"|'([^']*)'))/gi)) {
    const value = (match[1] ?? match[2] ?? "").replace(/^[\t\n\f\r ]+/, "");
    if (!value.startsWith("#") && !/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value)) {
      problems.push("a reference to something outside the file");
      break;
    }
  }
  /* url( followed by anything but a fragment, quoted or not. */
  if (/url\([\t\n\f\r ]*(?:['"](?!#)|(?![\t\n\f\r '"#]))/i.test(text)) {
    problems.push("a CSS url() outside the file");
  }
  /* A bare address anywhere else, apart from the two namespace declarations. A comment
     is not read, so a tool's generator note does not count, and taking comments away
     puts an address split by one back together. */
  const remote = withoutComments(text)
    .replace(/data:[^"']*/g, "")
    .split(SVG_NAMESPACE)
    .join("")
    .split(XLINK_NAMESPACE)
    .join("")
    .match(/https?:\/\/[^\s"'<)]+/i);
  if (remote) problems.push("an external address");

  return problems;
}

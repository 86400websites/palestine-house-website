/**
 * scripts/verify-svg-safety.ts — the cases src/lib/admin/file-safety.ts must keep holding.
 *
 *   pnpm exec tsx scripts/verify-svg-safety.ts
 *
 * The check is a pure function with no browser to prove it in the build, so a later edit
 * to one pattern could quietly reopen a way past it while typecheck, lint, build and the
 * e2e suite all stay green. Each refusal here is a shape that was seen to run script or
 * fetch from a file opened on disk in a real browser, or is the plain form of one. Each
 * pass is something a design tool really writes. Run it after touching that file.
 *
 * Offline. No network, no credentials, no database. The payloads are harmless markers
 * aimed at the reserved marker.invalid.
 */

import { checkSvgSafety } from "../src/lib/admin/file-safety";

const NS = 'xmlns="http://www.w3.org/2000/svg"';
const XL = 'xmlns:xlink="http://www.w3.org/1999/xlink"';
const M = "http://marker.invalid";
const R = '<rect width="60" height="60"/>';
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const utf16 = new Uint8Array([0xff, 0xfe, ...Buffer.from(`<svg ${NS}><script>x</script></svg><!--<svg-->`, "utf16le")]);
const esc = (before: string, after: string) => new Uint8Array([...Buffer.from(before), 0x1b, 0x28, 0x4a, ...Buffer.from(after)]);

const REFUSED: [string, string | Uint8Array<ArrayBuffer>][] = [
  // Plain forms
  ["plain script", `<svg ${NS}><script>x</script></svg>`],
  ["event handler", `<svg ${NS} onload="x"/>`],
  ["javascript: link", `<svg ${NS}><a href="javascript:x"><text>x</text></a></svg>`],
  ["DOCTYPE with entity", `<!DOCTYPE svg [<!ENTITY a "b">]><svg ${NS}/>`],
  ["xml-stylesheet instruction", `<?xml-stylesheet type="text/xsl" href="#x"?><svg ${NS}/>`],
  ["animation", `<svg ${NS}><animate attributeName="x" to="1"/></svg>`],
  ["embedded iframe", `<svg ${NS}><iframe/></svg>`],
  ["foreignObject", `<svg ${NS}><foreignObject/></svg>`],
  ["no svg at all", `<html></html>`],
  ["remote href", `<svg ${NS}><image href="${M}/x.png"/></svg>`],
  ["protocol-relative href", `<svg ${NS}><image href="//marker.invalid/x.png"/></svg>`],
  ["remote xlink:href", `<svg ${NS} ${XL}><image xlink:href="${M}/x.png"/></svg>`],
  ["href to an embedded SVG", `<svg ${NS}><image href="data:image/svg+xml;base64,AAAA"/></svg>`],
  ["src attribute", `<svg ${NS}><x src="//marker.invalid/x"/></svg>`],
  ["xml:base", `<svg ${NS}><image xml:base="//marker.invalid/" href="#x"/></svg>`],
  ["CSS url() to elsewhere", `<svg ${NS}><rect fill="url(${M}/x)"/></svg>`],
  ["CSS url() with one slash", `<svg ${NS}><style>svg{fill:url(http:/marker.invalid/x)}</style></svg>`],
  ["image-set", `<svg ${NS}><style>a{fill:image-set("//marker.invalid/x.png" 1x)}</style></svg>`],
  ["@import", `<svg ${NS}><style>@import "${M}/x.css";</style></svg>`],
  ["bare address in text", `<svg ${NS}><text>see ${M}</text></svg>`],

  // Another encoding
  ["UTF-16 with a BOM", utf16],
  ["ESC bytes, undeclared", esc(`<svg ${NS}><scr`, "ipt>x</script></svg>")],
  ["ISO-2022-JP split script", esc(`<?xml version="1.0" encoding="iso-2022-jp"?><svg ${NS}><scr`, "ipt>x</script></svg>")],
  ["a stray byte, so not UTF-8", new Uint8Array([...Buffer.from(`<svg ${NS}><text>caf`), 0xe9, ...Buffer.from(`</text></svg>`)])],
  ["declared UTF-7", `<?xml version="1.0" encoding="UTF-7"?><svg ${NS}/>`],
  ["encoding in another instruction", `<?xml-foo encoding='shift_jis'?><svg ${NS}/>`],
  ["encoding inside a longer word", `<?xml-foo xencoding='shift_jis'?><svg ${NS}/>`],
  ["encoding far into the head", `<?xml version="1.0"${" ".repeat(1100)}encoding="shift_jis"?><svg ${NS}/>`],

  // A namespace prefix or a foreign default namespace
  ["prefixed script bound to SVG", `<svg ${NS} xmlns:s="${"http://www.w3.org/2000/svg"}"><s:script>x</s:script></svg>`],
  ["a very long prefix", `<svg ${NS} xmlns:${"p".repeat(65)}='http://www.w3.org/2000/svg'><${"p".repeat(65)}:script>x</${"p".repeat(65)}:script></svg>`],
  ["a very long prefix, spaced", `<svg ${NS} xmlns:${"p".repeat(65)} = 'http://www.w3.org/2000/svg'/>`],
  ["U+FEFF in a prefix", `<svg ${NS} xmlns:a\uFEFFb='http://www.w3.org/2000/svg'/>`],
  ["U+1680 in a prefix", `<svg ${NS} xmlns:a\u1680b='http://www.w3.org/2000/svg'/>`],
  ["non-ASCII prefix", `<svg ${NS} xmlns:é="http://www.w3.org/2000/svg"><é:script>x</é:script></svg>`],
  ["XHTML namespace behind a reference", `<svg ${NS}><x:script xmlns:x="http&#58;//www.w3.org/1999/xhtml">x</x:script></svg>`],
  ["XHTML default namespace", `<svg xmlns="http://www.w3.org/1999/xhtml"><script>x</script></svg>`],
  ["xlink prefix bound to SVG", `<svg ${NS} xmlns:xlink="http://www.w3.org/2000/svg"><xlink:script>x</xlink:script></svg>`],

  // Escapes and references
  ["CSS escape in a style block", `<svg ${NS}><style>a{fill:u\\72l(//marker.invalid/x)}</style></svg>`],
  ["CSS escape in a style attribute", `<svg ${NS}><a style="fill:u\\72l(//marker.invalid/x)"/></svg>`],
  ["CSS escape in a fill attribute", `<svg ${NS}><rect fill="u\\72l(ht\\74p://marker.invalid/x)"/></svg>`],
  ["reference inside url()", `<svg ${NS}><style>a{fill:&#117;rl(//marker.invalid/x)}</style></svg>`],
  ["reference inside @import", `<svg ${NS}><style>&#x40;import "//marker.invalid/x";</style></svg>`],
  ["javascript: behind a reference", `<svg ${NS}><a href="java&#115;cript:x"><text>x</text></a></svg>`],
  ["javascript: behind a newline", `<svg ${NS}><a href="java&#10;script:x"><text>x</text></a></svg>`],
  ["a double-encoded fragment", `<svg ${NS}><image href="&#x26;#35;x"/></svg>`],
  ["a non-breaking space before the fragment", `<svg ${NS}><image href="&#160;#x"/></svg>`],

  // A decoy that swallows the real attribute after it
  ["decoy href in a title", `<svg ${NS}><title>href="#</title><a href="java&#10;script:x">${R}</a></svg>`],
  ["decoy href in a comment", `<svg ${NS}><!-- href="# --><a href="java&#10;script:x">${R}</a></svg>`],
  ["decoy before an image", `<svg ${NS}><title>href="#</title><image href="http:/marker.invalid/x.png"/></svg>`],
  ["decoy url( in a CSS comment", `<svg ${NS}><style>/* url(# */svg{fill:url(http:/marker.invalid/x)}</style>${R}</svg>`],

  // A style block with markup inside it
  ["@import split by a comment", `<svg ${NS}><style>@im<!-- x -->port "ht<!-- x -->tp://marker.invalid/x.css";</style></svg>`],
  ["url() split by a comment", `<svg ${NS}><style>svg{fill:u<!-- x -->rl(ht<!-- x -->tp://marker.invalid/x)}</style></svg>`],
  ["url() split by a child element", `<svg ${NS}><style>svg{fill:u<x/>rl(//marker.invalid/x)}</style></svg>`],
  ["url() split across CDATA", `<svg ${NS}><style><![CDATA[svg{fill:u]]><![CDATA[rl(//marker.invalid/x)}]]></style></svg>`],
  ["a fake close tag in a comment", `<svg ${NS}><style><!-- </style> -->svg{fill:u\\72l(//marker.invalid/x)}</style></svg>`],
  ["'/>' inside a quoted attribute", `<svg ${NS}><style id='/>'>svg{fill:u<!-- x -->rl(ht<!-- x -->tp://marker.invalid/x)}</style></svg>`],
  ["'/>' inside a double-quoted attribute", `<svg ${NS}><style id="/>">svg{fill:u<x/>rl(//marker.invalid/x)}</style></svg>`],
  ["a reference inside CDATA", `<svg ${NS}><style><![CDATA[svg{fill:url(&#35;x)}]]></style></svg>`],
];

const PASSES: [string, string][] = [
  ["a plain rect", `<svg ${NS} width="10" height="10">${R}</svg>`],
  ["with an XML declaration", `<?xml version="1.0" encoding="UTF-8"?><svg ${NS}/>`],
  ["single quotes in the declaration", `<?xml version='1.0' encoding='utf-8'?><svg ${NS}/>`],
  ["utf8 spelled without the hyphen", `<?xml version="1.0" encoding="utf8"?><svg ${NS}/>`],
  ["a declaration with no encoding", `<?xml version="1.0"?><svg ${NS}/>`],
  ["declaring xlink, as design tools do", `<svg ${NS} ${XL} width="10">${R}</svg>`],
  ["an internal xlink reference", `<svg ${NS} ${XL}><defs><rect id="a"/></defs><use xlink:href="#a"/></svg>`],
  ["an embedded PNG", `<svg ${NS} ${XL}><image xlink:href="data:image/png;base64,${PNG}"/></svg>`],
  ["an embedded image typed image/jpg", `<svg ${NS}><image href="data:image/jpg;base64,${PNG}"/></svg>`],
  ["base64 that happens to spell xmlns", `<svg ${NS}><image href="data:image/png;base64,AAxmlnsAA"/></svg>`],
  ["an internal gradient", `<svg ${NS}><defs><linearGradient id="g"/></defs><rect fill="url(#g)"/></svg>`],
  ["an editor's quoted internal url", `<svg ${NS}><rect style="fill:url(&quot;#g&quot;)"/></svg>`],
  ["a plain style block", `<svg ${NS}><style>.a{fill:#000;font-family:Georgia,serif}</style>${R}</svg>`],
  ["a style block with attributes", `<svg ${NS}><style id="s" type="text/css">.a{fill:#000}</style>${R}</svg>`],
  ["an empty self-closed style", `<svg ${NS}><style id="s"/>${R}</svg>`],
  ["one CDATA section in a style", `<svg ${NS}><style><![CDATA[.a{fill:#000}]]></style>${R}</svg>`],
  ["a style attribute", `<svg ${NS}><rect style="fill:#000"/></svg>`],
  ["a character reference in text", `<svg ${NS}><text>Food &#38; Drink&#160;</text></svg>`],
  ["xml:space", `<svg ${NS} xml:space="preserve"><text>a</text></svg>`],
  ["a data-* attribute", `<svg ${NS} data-name="Layer 1">${R}</svg>`],
  ["a generator comment with an address", `<!-- Generator: a tool - https://example.invalid/tool --><svg ${NS}>${R}</svg>`],
  ["a web address with no scheme, in text", `<svg ${NS}><text>www.example.invalid</text></svg>`],
];

/* The upload limit, and shapes built to make a careless pattern slow. */
const MB4 = 4 * 1024 * 1024;
const rep = (s: string) => s.repeat(Math.floor(MB4 / s.length));
const SLOW: [string, string][] = [
  ["unclosed style tags", rep("<style ")],
  ["open CDATA in style tags", rep("<style><![CDATA[")],
  ["unclosed comments", rep("<!--")],
  ["repeated xmlns:", rep("xmlns:")],
  ["repeated url(", rep("url(")],
  ["a huge head", `<?xml${" ".repeat(MB4)}`],
];

async function main(): Promise<void> {
  const toText = (body: string | Uint8Array<ArrayBuffer>) => new File([body], "x.svg").text();
  let wrong = 0;

  for (const [name, body] of REFUSED) {
    const problems = checkSvgSafety(await toText(body));
    if (problems.length === 0) {
      wrong += 1;
      console.log(`  FAIL  should be refused: ${name}`);
    }
  }
  for (const [name, body] of PASSES) {
    const problems = checkSvgSafety(await toText(body));
    if (problems.length > 0) {
      wrong += 1;
      console.log(`  FAIL  should pass: ${name} [${problems.join("; ")}]`);
    }
  }
  for (const [name, body] of SLOW) {
    const started = Date.now();
    checkSvgSafety(body);
    const ms = Date.now() - started;
    if (ms > 5000) {
      wrong += 1;
      console.log(`  FAIL  took ${ms}ms: ${name}`);
    }
  }

  console.log(`${REFUSED.length} refused · ${PASSES.length} pass · ${SLOW.length} hostile 4 MB shapes under 5 seconds`);
  console.log(wrong ? `${wrong} WRONG` : "THE SVG CHECK HOLDS");
  process.exit(wrong ? 1 : 0);
}

main().catch((e) => {
  console.error("\nCHECK FAILED TO RUN:", e instanceof Error ? e.message : e);
  process.exit(2);
});

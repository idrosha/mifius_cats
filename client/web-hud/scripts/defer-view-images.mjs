/**
 * Defer non-critical stitch images so boot does not fetch every hidden view.
 * - <img src> → data-mf-src (hydrateViewImages on showView)
 * - inline background-image → data-mf-bg + style stripped of bg
 * Keeps eager load for login / boot critical art.
 *
 * Usage: node scripts/defer-view-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");

const EAGER_VIEW_IDS = new Set(["viewLogin", "viewBoot"]);
const EAGER_SRC_RE =
  /login-bg\.webp|login-hero\.webp|mythfel-login|fonts\//i;

function walk(dir, pred) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, pred));
    else if (pred(p, e.name)) out.push(p);
  }
  return out;
}

/** Find section id containing offset, if any. */
function sectionIdAt(html, offset) {
  const before = html.slice(0, offset);
  const re = /<section\b[^>]*\bid=["']([^"']+)["'][^>]*>/gi;
  let m;
  let last = null;
  while ((m = re.exec(before))) last = m[1];
  return last;
}

function deferHtml(html, { wholeFileEager = false } = {}) {
  let deferredImgs = 0;
  let deferredBgs = 0;
  let eagerImgs = 0;

  // 1) <img ... src="..."> → data-mf-src (skip empty / data: / already deferred)
  html = html.replace(/<img\b([^>]*?)>/gi, (full, attrs, offset) => {
    // Drop XHTML self-close slash so we don't emit `alt="" / decoding=...`
    attrs = attrs.replace(/\s*\/\s*$/, "");
    if (/\bdata-mf-src\s*=/i.test(attrs)) {
      // ensure decoding async
      if (!/\bdecoding\s*=/i.test(attrs)) {
        return `<img${attrs} decoding="async">`;
      }
      return `<img${attrs}>`;
    }
    const srcM = attrs.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
    if (!srcM) return full;
    const quote = srcM[1];
    const src = srcM[2];
    if (!src || src.startsWith("data:") || src.startsWith("blob:")) return full;

    const viewId = sectionIdAt(html, offset);
    const eager =
      wholeFileEager ||
      (viewId && EAGER_VIEW_IDS.has(viewId)) ||
      EAGER_SRC_RE.test(src);

    let nextAttrs = attrs;
    if (!/\bdecoding\s*=/i.test(nextAttrs)) {
      nextAttrs += ` decoding="async"`;
    }

    if (eager) {
      eagerImgs += 1;
      if (!/\bloading\s*=/i.test(nextAttrs) && !EAGER_SRC_RE.test(src)) {
        nextAttrs += ` loading="lazy"`;
      }
      if (EAGER_SRC_RE.test(src) && !/\bfetchpriority\s*=/i.test(nextAttrs)) {
        nextAttrs += ` fetchpriority="high"`;
      }
      return `<img${nextAttrs}>`;
    }

    // Move src → data-mf-src; leave a tiny transparent placeholder to avoid broken-icon flash
    nextAttrs = nextAttrs.replace(/\bsrc\s*=\s*(["']).*?\1/i, "");
    if (!/\bloading\s*=/i.test(nextAttrs)) nextAttrs += ` loading="lazy"`;
    deferredImgs += 1;
    return `<img${nextAttrs} data-mf-src=${quote}${src}${quote} src=${quote}${quote}>`;
  });

  // 2) inline style="...background-image: url(...);..."
  html = html.replace(
    /\bstyle=(["'])(.*?)\1/gi,
    (full, quote, style, offset) => {
      const bgM = style.match(
        /background-image\s*:\s*url\(\s*(?:&quot;|"|')?([^)"'&]+)(?:&quot;|"|')?\s*\)\s*;?/i,
      );
      if (!bgM) return full;
      const url = bgM[1].trim();
      if (!url || url.startsWith("data:")) return full;

      const viewId = sectionIdAt(html, offset);
      const eager =
        wholeFileEager ||
        (viewId && EAGER_VIEW_IDS.has(viewId)) ||
        EAGER_SRC_RE.test(url);
      if (eager) return full;

      const cleaned = style
        .replace(
          /background-image\s*:\s*url\(\s*(?:&quot;|"|')?[^)]+(?:&quot;|"|')?\s*\)\s*;?/i,
          "",
        )
        .trim()
        .replace(/;\s*;/g, ";")
        .replace(/^;|;$/g, "");
      deferredBgs += 1;
      const styleAttr = cleaned ? ` style=${quote}${cleaned}${quote}` : "";
      return `data-mf-bg=${quote}${url}${quote}${styleAttr}`;
    },
  );

  return { html, deferredImgs, deferredBgs, eagerImgs };
}

function writeRetry(file, text, attempts = 8) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      fs.writeFileSync(file, text);
      return;
    } catch (err) {
      lastErr = err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100 * (i + 1));
    }
  }
  throw lastErr;
}

function processFile(file, opts = {}) {
  const raw = fs.readFileSync(file, "utf8");
  if (raw.includes("data-mf-src=") && raw.includes("data-mf-bg=")) {
    // Already deferred enough — still count
    const deferredImgs = (raw.match(/data-mf-src=/g) || []).length;
    const deferredBgs = (raw.match(/data-mf-bg=/g) || []).length;
    return { file, deferredImgs, deferredBgs, eagerImgs: 0, changed: false };
  }
  const { html, deferredImgs, deferredBgs, eagerImgs } = deferHtml(raw, opts);
  if (html !== raw) writeRetry(file, html);
  return { file, deferredImgs, deferredBgs, eagerImgs, changed: html !== raw };
}

function patchIndexHead(indexPath) {
  let html = fs.readFileSync(indexPath, "utf8");
  if (html.includes('rel="preload"') && html.includes("login-bg.webp")) {
    return false;
  }
  const preload = `  <link rel="preload" as="image" href="/stitch-assets/login-bg.webp?v=opt2" fetchpriority="high" />
  <link rel="preload" as="image" href="/stitch-assets/login-hero.webp?v=opt2" />
`;
  if (!html.includes("login-bg.webp?v=opt2")) {
    html = html.replace("</head>", `${preload}</head>`);
    fs.writeFileSync(indexPath, html);
    return true;
  }
  return false;
}

function main() {
  const results = [];
  const indexPath = path.join(PUBLIC, "index.html");
  if (fs.existsSync(indexPath)) {
    results.push(processFile(indexPath));
    patchIndexHead(indexPath);
  }

  for (const f of walk(path.join(PUBLIC, "stitch"), (p, name) => name.endsWith(".html"))) {
    // Standalone stitch pages: defer everything except login.html critical art
    const base = path.basename(f);
    const wholeFileEager = false;
    const r = processFile(f, { wholeFileEager });
    // login.html: restore eager for its hero if deferred
    if (base === "login.html") {
      let html = fs.readFileSync(f, "utf8");
      html = html.replace(
        /<img([^>]*?)data-mf-src="(\/stitch-assets\/login-bg\.webp[^"]*)"\s+src=""/gi,
        `<img$1src="$2" fetchpriority="high"`,
      );
      fs.writeFileSync(f, html);
    }
    results.push(r);
  }

  const di = results.reduce((s, r) => s + r.deferredImgs, 0);
  const db = results.reduce((s, r) => s + r.deferredBgs, 0);
  console.log(
    `deferred imgs=${di} bgs=${db} across ${results.filter((r) => r.changed).length} files`,
  );
  for (const r of results.filter((r) => r.deferredImgs || r.deferredBgs)) {
    console.log(
      `  ${path.relative(PUBLIC, r.file)}: imgs=${r.deferredImgs} bgs=${r.deferredBgs} eager=${r.eagerImgs}`,
    );
  }
}

main();

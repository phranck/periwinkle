/**
 * Builds the standalone icon-picker tool.
 *
 * The tool is a single self-contained HTML file: the whole Iconsax Bulk set
 * and the current mapping are inlined, so it works when opened straight from
 * disk with no server and no network. Run it after changing the mapping or
 * upgrading iconsax-react:
 *
 *   node tools/build-icon-picker.mjs
 *
 * Regenerate the icon data first with `node tools/extract-icons.mjs` when the
 * iconsax-react dependency changes.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const toolsDir = fileURLToPath(new URL(".", import.meta.url));
const iconsPath = `${toolsDir}iconsax-bulk.json`;
const mappingPath = `${toolsDir}../src/render/section-icons.json`;
const outPath = `${toolsDir}icon-picker.html`;

const icons = JSON.parse(readFileSync(iconsPath, "utf8"));
const mapping = JSON.parse(readFileSync(mappingPath, "utf8"));

/** Inlines JSON safely inside a <script> block. */
function embed(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const html = `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>periwinkle · Section icon picker</title>
<style>
  :root {
    --bg: #ffffff; --surface: #f6f8fa; --surface-alt: #eff2f5;
    --text: #1f2328; --muted: #59636e; --border: #d1d9e0;
    --accent: #6667ab; --danger: #d1242f; --radius: 12px;
  }
  [data-theme="dark"] {
    --bg: #0d1117; --surface: #161b22; --surface-alt: #21262d;
    --text: #e6edf3; --muted: #8b949e; --border: #30363d; --accent: #9a9bd4;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font: 17px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  header {
    position: sticky; top: 0; z-index: 10; display: flex; gap: 12px;
    align-items: center; flex-wrap: wrap;
    padding: 14px 20px; background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  h1 { font-size: 20px; margin: 0 auto 0 0; }
  /* Every header control shares one height, so the row reads as a single strip. */
  header button, header input, header select, header .search-field input {
    height: 36px; box-sizing: border-box;
  }
  input[type="search"], input[type="text"] {
    padding: 5px 12px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--bg); color: var(--text); font: inherit; min-width: 220px;
  }
  button {
    padding: 5px 14px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--bg); color: var(--text); font: inherit; cursor: pointer;
  }
  button:hover { border-color: var(--accent); color: var(--accent); }
  button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  button.primary:hover { filter: brightness(1.1); color: #fff; }
  main { padding: 20px; max-width: 1100px; margin: 0 auto; }
  .hint { color: var(--muted); font-size: 15px; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); }
  th { font-size: 14px; color: var(--muted); font-weight: 600; }
  td.title { font-weight: 500; }
  td.actions { text-align: right; white-space: nowrap; }
  .pick {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 3px 12px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--surface); cursor: pointer; font: inherit; color: inherit;
  }
  .pick:hover { border-color: var(--accent); }
  .pick--active { border-color: var(--accent); background: var(--surface-alt); }
  .pick svg { width: 28px; height: 28px; color: var(--accent); }
  .pick .name { font-size: 15px; color: var(--muted); }
  .del {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 12px; border-radius: 8px;
    color: var(--danger); border-color: var(--border); background: var(--surface);
  }
  .del svg { width: 18px; height: 18px; }
  .del:hover { color: var(--danger); border-color: var(--danger); background: var(--surface-alt); }
  /* Sticky composer: adding a title stays reachable at any scroll position. */
  .composer {
    position: sticky; bottom: 0; z-index: 8; margin: 24px auto 0;
    padding: 12px 20px 18px; background: transparent;
    max-width: 1100px; width: 100%;
    /* Clicks pass through the transparent area to the rows underneath. */
    pointer-events: none;
  }
  .composer > * { pointer-events: auto; }
  .composer__inner {
    display: flex; gap: 10px; align-items: center;
    padding: 10px 12px; border: 1px solid var(--border); border-radius: 999px;
    background: var(--surface);
    box-shadow: 0 8px 28px rgb(0 0 0 / 0.16), 0 2px 6px rgb(0 0 0 / 0.08);
    transition: border-color 120ms ease;
  }
  .composer__inner:focus-within { border-color: var(--accent); }
  .composer__field { display: flex; align-items: center; gap: 8px; flex: 1; }
  .composer__field input { flex: 1; border: 0; background: transparent; min-width: 0; }
  .composer__field input:focus { outline: none; }
  .composer__inner button { border-radius: 999px; }
  .search-field { display: inline-flex; align-items: center; position: relative; }
  .search-field input { padding-right: 62px; }
  .search-field .keycaps { position: absolute; right: 8px; pointer-events: none; }
  .keycaps { display: inline-flex; gap: 4px; }
  .keycaps kbd {
    font: inherit; font-size: 12px; line-height: 1; color: var(--muted);
    border: 1px solid var(--border); border-radius: 5px; padding: 3px 5px;
    background: var(--bg);
  }
  .default-hint { display: flex; align-items: center; gap: 10px; }
  .notice {
    margin: 10px 0 0; padding: 10px 14px; border-radius: 8px; font-size: 15px;
    border: 1px solid var(--border); background: var(--surface); color: var(--text);
  }
  .notice[hidden] { display: none; }
  .notice--warn { border-color: var(--danger); color: var(--danger); }
  dialog {
    width: min(860px, 92vw); max-height: 84vh; padding: 0;
    border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--bg); color: var(--text);
  }
  dialog::backdrop { background: rgb(0 0 0 / 0.5); }
  .dlg-head {
    position: sticky; top: 0; display: flex; gap: 12px; align-items: center;
    padding: 14px 16px; background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .dlg-head strong { margin-right: auto; }
  .grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
    gap: 8px; padding: 16px; overflow: auto; max-height: 64vh;
    /* Keep rows at their natural height: with a fixed grid height the rows
       would otherwise stretch, turning a single result row into full-height
       columns. */
    align-content: start; align-items: start;
  }
  .grid button {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 14px 6px; border-color: transparent; background: var(--surface-alt);
  }
  .grid button svg { width: 40px; height: 40px; color: var(--accent); }
  .grid button span {
    font-size: 12px; color: var(--muted); text-align: center;
    word-break: break-word; line-height: 1.2;
  }
  .grid button.active { border-color: var(--accent); }
  .count { color: var(--muted); font-size: 14px; }
  .icon-button {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 5px; width: 36px;
  }
  .icon-button svg { width: 20px; height: 20px; color: var(--muted); }
  .icon-button:hover svg { color: var(--accent); }
  .variant-label { font-size: 14px; color: var(--muted); }
  select {
    padding: 5px 10px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--bg); color: var(--text); font: inherit;
  }
  .pick .variant { font-size: 12px; color: var(--accent); }
  /* Resize affordances: the dialog grows symmetrically around its centre, so
     every edge and corner drags the same box outwards from the middle. */
  /* Stays pinned while the page behind it scrolls. Fixed positioning also
     gives the absolutely positioned resize handles their containing block. */
  dialog { position: fixed; inset: 0; margin: auto; }
  /* Freeze the page behind the modal so a scroll gesture cannot drift it. */
  body:has(dialog[open]) { overflow: hidden; }
  .rz { position: absolute; z-index: 5; }
  .rz-n { top: -4px; left: 12px; right: 12px; height: 8px; cursor: ns-resize; }
  .rz-s { bottom: -4px; left: 12px; right: 12px; height: 8px; cursor: ns-resize; }
  .rz-w { left: -4px; top: 12px; bottom: 12px; width: 8px; cursor: ew-resize; }
  .rz-e { right: -4px; top: 12px; bottom: 12px; width: 8px; cursor: ew-resize; }
  .rz-nw { top: -5px; left: -5px; width: 16px; height: 16px; cursor: nwse-resize; }
  .rz-se { bottom: -5px; right: -5px; width: 16px; height: 16px; cursor: nwse-resize; }
  .rz-ne { top: -5px; right: -5px; width: 16px; height: 16px; cursor: nesw-resize; }
  .rz-sw { bottom: -5px; left: -5px; width: 16px; height: 16px; cursor: nesw-resize; }
</style>
</head>
<body>
<header>
  <h1>Section icon picker</h1>
  <span class="count" id="count"></span>
  <label class="search-field">
    <input type="search" id="filter" placeholder="Filter titles…" aria-label="Filter titles">
    <span class="keycaps" aria-hidden="true"><kbd>⌘</kbd><kbd>K</kbd></span>
  </label>
  <button type="button" id="copy">Copy JSON</button>
  <button type="button" class="primary" id="download">Download JSON</button>
  <button type="button" class="icon-button" id="theme" aria-label="Toggle color scheme" title="Toggle color scheme"></button>
</header>
<main>
  <p class="hint">
    Each row maps a section title to an Iconsax icon. periwinkle matches the title of an
    OpenAPI tag against these keys (lowercased, singular and plural both work) and falls back
    to the default icon when nothing matches. Click an icon to change it, add your own titles
    at the bottom, then save the file over
    <code>src/render/section-icons.json</code>.
  </p>

  <p class="hint default-hint">
    Default icon for unmatched titles:
    <button type="button" class="pick" id="default-pick"></button>
  </p>

  <table>
    <thead>
      <tr>
        <th style="width:34%">Section title</th>
        <th>Bulk</th>
        <th>TwoTone</th>
        <th style="width:1%"></th>
      </tr>
    </thead>
    <tbody id="rows"></tbody>
  </table>

</main>

<div class="composer">
  <div class="composer__inner">
    <label class="composer__field">
      <input type="text" id="new-title" placeholder="New section title, e.g. Warehouses">
      <span class="keycaps" aria-hidden="true"><kbd>⌘</kbd><kbd>⇧</kbd><kbd>K</kbd></span>
    </label>
    <button type="button" id="add">Add title</button>
  </div>
  <p class="notice" id="notice" role="status" hidden></p>
</div>

<dialog id="dlg">
  <div class="dlg-head">
    <strong id="dlg-title">Pick an icon</strong>
    <label class="variant-label" for="variant">Style</label>
    <select id="variant" aria-label="Icon style">
      <option value="Bulk">Bulk</option>
      <option value="TwoTone">TwoTone</option>
    </select>
    <input type="search" id="icon-search" placeholder="Search ${icons.length} icons…" aria-label="Search icons">
    <button type="button" id="dlg-close">Close</button>
  </div>
  <div class="grid" id="icon-grid"></div>
  <div class="rz rz-n" data-rz="n"></div>
  <div class="rz rz-s" data-rz="s"></div>
  <div class="rz rz-w" data-rz="w"></div>
  <div class="rz rz-e" data-rz="e"></div>
  <div class="rz rz-nw" data-rz="nw"></div>
  <div class="rz rz-ne" data-rz="ne"></div>
  <div class="rz rz-sw" data-rz="sw"></div>
  <div class="rz rz-se" data-rz="se"></div>
</dialog>

<script>
const ICONS = ${embed(icons)};
const STATE = ${embed(mapping)};
const BY_NAME = new Map(ICONS.map((entry) => [entry.name, entry]));

/** Splits a stored reference like "Shop" or "Shop:TwoTone" into its parts. */
function parseRef(ref) {
  const [name, variant] = String(ref).split(":");
  return { name, variant: variant === "TwoTone" ? "TwoTone" : "Bulk" };
}

/** Builds the stored reference; Bulk is the default and stays implicit. */
function makeRef(name, variant) {
  return variant === "TwoTone" ? name + ":TwoTone" : name;
}
const SVG_NS = "http://www.w3.org/2000/svg";
const parser = new DOMParser();

const rows = document.getElementById("rows");
const dlg = document.getElementById("dlg");
const grid = document.getElementById("icon-grid");
const iconSearch = document.getElementById("icon-search");
const dlgTitle = document.getElementById("dlg-title");
const filter = document.getElementById("filter");
const count = document.getElementById("count");
const variantSelect = document.getElementById("variant");
let pickTarget = null;

/** Parses one icon's markup into a real SVG node (no innerHTML anywhere). */
function svgFor(name, variant) {
  const entry = BY_NAME.get(name);
  const inner = variant === "TwoTone" ? (entry?.twoTone ?? entry?.bulk) : entry?.bulk;
  if (!inner) return document.createElementNS(SVG_NS, "svg");
  const doc = parser.parseFromString(
    '<svg xmlns="' + SVG_NS + '" viewBox="0 0 24 24" fill="none">' + inner + "</svg>",
    "image/svg+xml",
  );
  const node = document.importNode(doc.documentElement, true);
  node.setAttribute("aria-hidden", "true");
  return node;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (tag === "button") node.type = "button";
  return node;
}

/** Builds the icon button shown in a row and for the default. */
function pickButton(ref, targetKey, style) {
  const { name, variant } = parseRef(ref);
  const button = el("button", "pick");
  button.dataset.title = targetKey;
  button.dataset.style = style;
  // The badge previews its own style, so both columns show the same icon
  // drawn each way; the one in use is highlighted.
  if (variant === style) button.classList.add("pick--active");
  button.append(svgFor(name, style), el("span", "name", name));
  return button;
}

function renderRows() {
  const needle = filter.value.trim().toLowerCase();
  rows.replaceChildren();
  // Always render in alphabetical order, so a freshly added title appears in
  // its proper place rather than at the end.
  const entries = Object.entries(STATE.icons).sort(([a], [b]) => a.localeCompare(b));
  for (const [title, icon] of entries) {
    if (needle && !title.includes(needle) && !icon.toLowerCase().includes(needle)) continue;
    const row = el("tr");
    row.append(el("td", "title", title));

    for (const style of ["Bulk", "TwoTone"]) {
      const cell = el("td");
      cell.append(pickButton(icon, title, style));
      row.append(cell);
    }

    const actions = el("td", "actions");
    const remove = el("button", "del");
    remove.dataset.del = title;
    remove.append(svgFor("Trash", "Bulk"), el("span", undefined, "Remove"));
    actions.append(remove);
    row.append(actions);

    rows.append(row);
  }
  count.textContent = Object.keys(STATE.icons).length + " titles";
  renderDefault();
}

function renderDefault() {
  const slot = document.getElementById("default-pick");
  const parsedDefault = parseRef(STATE.default);
  slot.replaceChildren(
    svgFor(parsedDefault.name, parsedDefault.variant),
    el("span", "name", parsedDefault.name),
  );
  if (parsedDefault.variant === "TwoTone") slot.append(el("span", "variant", "TwoTone"));
  slot.dataset.style = parsedDefault.variant;
  slot.dataset.title = "__default__";
}

function openPicker(title, style) {
  pickTarget = title;
  dlgTitle.textContent =
    title === "__default__" ? "Default icon for unmatched titles" : 'Icon for "' + title + '"';
  const currentRef = title === "__default__" ? STATE.default : STATE.icons[title];
  variantSelect.value = style ?? parseRef(currentRef).variant;
  iconSearch.value = "";
  renderGrid();
  dlg.showModal();
  applySize(storedSize());
  iconSearch.focus();
}

function renderGrid() {
  const needle = iconSearch.value.trim().toLowerCase();
  const currentRef = pickTarget === "__default__" ? STATE.default : STATE.icons[pickTarget];
  const current = parseRef(currentRef).name;
  const variant = variantSelect.value;
  const list = needle ? ICONS.filter((i) => i.name.toLowerCase().includes(needle)) : ICONS;
  grid.replaceChildren();
  // The whole set is rendered: capping the grid would silently hide icons.
  for (const entry of list) {
    const button = el("button");
    button.type = "button";
    button.dataset.icon = entry.name;
    button.title = entry.name;
    if (entry.name === current) button.classList.add("active");
    button.append(svgFor(entry.name, variant), el("span", undefined, entry.name));
    grid.append(button);
  }
}

document.addEventListener("click", (event) => {
  const pick = event.target.closest(".pick");
  if (pick) {
    openPicker(pick.dataset.title, pick.dataset.style);
    return;
  }
  const del = event.target.closest("[data-del]");
  if (del) {
    delete STATE.icons[del.dataset.del];
    renderRows();
    return;
  }
  const choice = event.target.closest("[data-icon]");
  if (choice) {
    const ref = makeRef(choice.dataset.icon, variantSelect.value);
    if (pickTarget === "__default__") STATE.default = ref;
    else STATE.icons[pickTarget] = ref;
    dlg.close();
    renderRows();
  }
});

document.getElementById("dlg-close").addEventListener("click", () => dlg.close());
iconSearch.addEventListener("input", renderGrid);
variantSelect.addEventListener("change", renderGrid);
filter.addEventListener("input", renderRows);

const notice = document.getElementById("notice");

/** Shows an inline message; no native alert interrupts the flow. */
function showNotice(text, kind) {
  notice.textContent = text;
  notice.classList.toggle("notice--warn", kind === "warn");
  notice.hidden = false;
}

function clearNotice() {
  notice.hidden = true;
}

document.getElementById("add").addEventListener("click", () => {
  const input = document.getElementById("new-title");
  const title = input.value.trim().toLowerCase();
  if (!title) return;
  if (STATE.icons[title]) {
    // Already mapped: point at the existing row instead of overwriting it.
    showNotice('"' + title + '" is already in the list, currently ' + parseRef(STATE.icons[title]).name + ".", "warn");
    filter.value = title;
    renderRows();
    return;
  }
  clearNotice();
  STATE.icons[title] = STATE.default;
  input.value = "";
  filter.value = "";
  renderRows();
  openPicker(title);
});

document.getElementById("new-title").addEventListener("keydown", (event) => {
  if (event.key === "Enter") document.getElementById("add").click();
});

document.getElementById("new-title").addEventListener("input", clearNotice);

/* ESC hands focus back to the page from either text field. */
for (const field of [filter, document.getElementById("new-title")]) {
  field.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    field.blur();
  });
}

/** Serializes the mapping with sorted keys, ready to save over the JSON file. */
function serialize() {
  const sorted = {};
  for (const key of Object.keys(STATE.icons).sort()) sorted[key] = STATE.icons[key];
  const payload = { comment: STATE.comment, default: STATE.default, icons: sorted };
  return JSON.stringify(payload, null, 2) + "\\n";
}

document.getElementById("copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(serialize());
  const button = document.getElementById("copy");
  button.textContent = "Copied";
  setTimeout(() => (button.textContent = "Copy JSON"), 1200);
});

document.getElementById("download").addEventListener("click", () => {
  const blob = new Blob([serialize()], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "section-icons.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

/* Resizing: the dialog is centred, so a drag on any edge moves that edge and
   its opposite by the same amount. The chosen size is remembered. */
const SIZE_KEY = "pw-icon-picker:size";
const MIN_W = 420;
const MIN_H = 320;

function applySize(size) {
  if (!size) return;
  dlg.style.width = size.w + "px";
  dlg.style.maxWidth = "none";
  dlg.style.height = size.h + "px";
  dlg.style.maxHeight = "none";
  const body = dlg.querySelector(".grid");
  body.style.maxHeight = "none";
  body.style.height = size.h - dlg.querySelector(".dlg-head").offsetHeight - 2 + "px";
}

function storedSize() {
  try {
    const raw = localStorage.getItem(SIZE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

let resize = null;

for (const handle of dlg.querySelectorAll("[data-rz]")) {
  handle.addEventListener("pointerdown", (event) => {
    const rect = dlg.getBoundingClientRect();
    resize = {
      dir: handle.dataset.rz,
      x: event.clientX,
      y: event.clientY,
      w: rect.width,
      h: rect.height,
    };
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  handle.addEventListener("pointermove", (event) => {
    if (!resize) return;
    // Doubling the delta keeps the growth symmetric around the centre.
    const dx = (event.clientX - resize.x) * 2;
    const dy = (event.clientY - resize.y) * 2;
    let w = resize.w;
    let h = resize.h;
    if (resize.dir.includes("e")) w = resize.w + dx;
    if (resize.dir.includes("w")) w = resize.w - dx;
    if (resize.dir.includes("s")) h = resize.h + dy;
    if (resize.dir.includes("n")) h = resize.h - dy;
    applySize({
      w: Math.max(MIN_W, Math.min(w, window.innerWidth - 24)),
      h: Math.max(MIN_H, Math.min(h, window.innerHeight - 24)),
    });
  });
  handle.addEventListener("pointerup", (event) => {
    if (!resize) return;
    resize = null;
    handle.releasePointerCapture(event.pointerId);
    const rect = dlg.getBoundingClientRect();
    try {
      localStorage.setItem(SIZE_KEY, JSON.stringify({ w: rect.width, h: rect.height }));
    } catch {
      // Storage can be unavailable; the size then simply is not remembered.
    }
  });
}

/* Shortcuts: ⌘K focuses the title filter, ⌘⇧K the new-title field. Browsers
   reserve ⌘T for a new tab and never hand it to the page, so the second entry
   point uses the shifted variant of the same key. */
document.addEventListener("keydown", (event) => {
  if (!(event.metaKey || event.ctrlKey)) return;
  if (event.key.toLowerCase() !== "k") return;
  event.preventDefault();
  const target = event.shiftKey ? document.getElementById("new-title") : filter;
  target.focus();
  target.select?.();
});

const themeButton = document.getElementById("theme");

/** Shows the scheme the button switches to: a sun while dark, a moon while light. */
function renderThemeIcon() {
  const dark = document.documentElement.dataset.theme === "dark";
  themeButton.replaceChildren(svgFor(dark ? "Sun1" : "Moon", "Bulk"));
}

themeButton.addEventListener("click", () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  renderThemeIcon();
});

renderThemeIcon();

renderRows();
</script>
</body>
</html>
`;

writeFileSync(outPath, html);
process.stdout.write(`Wrote ${outPath} (${(html.length / 1024).toFixed(0)} KB)\n`);

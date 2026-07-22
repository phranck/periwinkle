/**
 * Document-wide search: index, ranking, highlighting, and the modal dialog
 * controller.
 *
 * The index/search/highlight half is adopted 1:1 from the reference
 * implementation (`api-document-search.ts`); the rendered content stays the
 * only search source and entries are marked explicitly with
 * `data-api-search-*` attributes. The controller half ports the reference's
 * React search controller (`ApiDocumentSearch`) to vanilla DOM: it opens the
 * statically rendered dialog, renders accessible grouped results, and
 * coordinates modal focus, keyboard navigation, smooth scrolling, URL state,
 * and persistent in-document highlighting.
 */

import { setSectionOpen } from "./client.js";

/** A normalized, searchable content unit from the rendered API document. */
export interface DocumentSearchEntry {
  /** Optional trailing label shown on the result row, e.g. `GET /books`. */
  addon?: string;
  /** The marked content element the entry was indexed from. */
  element: HTMLElement;
  /** Visible API-reference area the entry belongs to, e.g. a group name. */
  group: string;
  /** Entry kind driving the result icon: `chapter`, `operation`, `schema`, … */
  kind: string;
  /** Id of the element the result navigates to. */
  targetId: string;
  /** Searchable prose extracted from the entry element. */
  text: string;
  /** Human-readable result title. */
  title: string;
}

/** One ranked document match with the context needed by the result overlay. */
export interface DocumentSearchResult extends DocumentSearchEntry {
  /** The query term that matched the entry text, used for snippet marking. */
  matchedTerm: string;
  /** Sort rank; lower is better. Combines title affinity and document order. */
  score: number;
  /** Shortened prose context around the first match. */
  snippet: string;
}

/** Search matches grouped under their visible API-reference area. */
export interface DocumentSearchResultGroup {
  group: string;
  results: DocumentSearchResult[];
}

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Removes fenced examples and controls before extracting searchable prose. */
function searchableText(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      "pre, [data-code-block], script, style, button, .sr-only, [data-api-search-ignore]",
    )
    .forEach((node) => {
      node.remove();
    });
  return clone.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

/**
 * Builds one source-of-truth index from explicitly marked rendered content.
 *
 * @param root The content root carrying `[data-api-search-entry]` elements.
 * @returns One entry per marked element that has a group, title, and target.
 */
export function buildDocumentSearchIndex(root: HTMLElement): DocumentSearchEntry[] {
  return [...root.querySelectorAll<HTMLElement>("[data-api-search-entry]")].flatMap((element) => {
    const group = element.dataset.apiSearchGroup?.trim();
    const title = element.dataset.apiSearchTitle?.trim();
    const targetId = element.dataset.apiSearchTarget?.trim() || element.id;
    if (!group || !title || !targetId) return [];

    return [
      {
        addon: element.dataset.apiSearchAddon?.trim() || undefined,
        element,
        group,
        kind: element.dataset.apiSearchKind?.trim() || "document",
        targetId,
        text: searchableText(element),
        title,
      },
    ];
  });
}

function matchedTerm(text: string, query: string, terms: string[]): string {
  if (normalize(text).includes(query)) return query;
  return terms.find((term) => normalize(text).includes(term)) ?? terms[0] ?? query;
}

function resultSnippet(text: string, term: string): string {
  const normalizedText = normalize(text);
  const matchIndex = normalizedText.indexOf(term);
  if (matchIndex < 0 || text.length <= 150) return text;
  const start = Math.max(0, matchIndex - 52);
  const end = Math.min(text.length, matchIndex + term.length + 82);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

/**
 * Searches all prose tokens and preserves document order inside ranked groups.
 *
 * @param entries The index produced by {@link buildDocumentSearchIndex}.
 * @param rawQuery The user's raw query text.
 * @returns Result groups ordered by their best-ranked match; empty for an
 *   empty query.
 */
export function searchDocumentIndex(
  entries: DocumentSearchEntry[],
  rawQuery: string,
): DocumentSearchResultGroup[] {
  const query = normalize(rawQuery);
  if (!query) return [];
  const terms = query.split(" ").filter(Boolean);

  const results = entries
    .flatMap((entry, order) => {
      const title = normalize(entry.title);
      const haystack = normalize(`${entry.title} ${entry.addon ?? ""} ${entry.text}`);
      if (!terms.every((term) => haystack.includes(term))) return [];
      const score =
        title === query ? 0 : title.startsWith(query) ? 1 : title.includes(query) ? 2 : 3;
      const term = matchedTerm(entry.text || entry.title, query, terms);
      return [
        {
          ...entry,
          matchedTerm: term,
          score: score * 10_000 + order,
          snippet: resultSnippet(entry.text, term),
        },
      ];
    })
    .sort((left, right) => left.score - right.score);

  const groups = new Map<string, DocumentSearchResult[]>();
  for (const result of results) {
    const group = groups.get(result.group) ?? [];
    group.push(result);
    groups.set(result.group, group);
  }
  return [...groups].map(([group, groupedResults]) => ({ group, results: groupedResults }));
}

const excludedHighlightParent = (node: Node) =>
  node.parentElement?.closest("pre, [data-code-block], script, style, [data-api-search-ignore]") !==
  null;

interface TextMatchRange {
  end: number;
  start: number;
}

const escapeRegularExpression = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function addTextMatches(ranges: TextMatchRange[], value: string, pattern: RegExp): void {
  for (const match of value.matchAll(pattern)) {
    if (!match[0]) continue;
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (ranges.some((range) => start < range.end && range.start < end)) continue;
    ranges.push({ start, end });
  }
}

/** Finds contiguous phrases before their individual terms so related words share one visual mark. */
function textMatchRanges(value: string, rawQuery: string): TextMatchRange[] {
  const queryTerms = rawQuery.trim().split(/\s+/).filter(Boolean);
  if (!queryTerms.length) return [];

  const ranges: TextMatchRange[] = [];
  if (queryTerms.length > 1) {
    addTextMatches(
      ranges,
      value,
      new RegExp(queryTerms.map(escapeRegularExpression).join("\\s+"), "giu"),
    );
  }
  for (const term of [...new Set(queryTerms)]) {
    addTextMatches(ranges, value, new RegExp(escapeRegularExpression(term), "giu"));
  }
  return ranges;
}

/**
 * Removes the previous search mark without changing surrounding content nodes.
 *
 * @param root The subtree to clear; defaults to the whole document.
 */
export function clearDocumentSearchHighlight(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("mark[data-api-search-highlight]").forEach((mark) => {
    const parent = mark.parentNode;
    mark.replaceWith(document.createTextNode(mark.textContent ?? ""));
    parent?.normalize();
  });
}

/**
 * Marks every matching prose occurrence while keeping contiguous query
 * phrases together.
 *
 * @param target The content element to mark matches inside.
 * @param rawQuery The raw query whose terms are highlighted.
 * @returns The inserted `mark` elements in document order.
 */
export function highlightDocumentSearchMatches(
  target: HTMLElement,
  rawQuery: string,
): HTMLElement[] {
  clearDocumentSearchHighlight(target.ownerDocument);
  const walker = target.ownerDocument.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!excludedHighlightParent(node)) textNodes.push(node as Text);
  }

  const marks: HTMLElement[] = [];
  for (const node of textNodes) {
    const value = node.textContent ?? "";
    const ranges = textMatchRanges(value, rawQuery).sort((left, right) => right.start - left.start);
    const nodeMarks: HTMLElement[] = [];
    for (const { start, end } of ranges) {
      const range = target.ownerDocument.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);
      const mark = target.ownerDocument.createElement("mark");
      mark.dataset.apiSearchHighlight = "true";
      range.surroundContents(mark);
      nodeMarks.unshift(mark);
    }
    marks.push(...nodeMarks);
  }
  return marks;
}

/** Close animation duration; the reference dismisses after this delay. */
const SEARCH_DIALOG_CLOSE_DURATION_MS = 180;

/** A selected result kept until the close animation has finished. */
interface PendingSelection {
  query: string;
  result: DocumentSearchResult;
}

const optionId = (targetId: string, index: number) =>
  `api-search-option-${targetId.replace(/[^a-zA-Z0-9_-]+/g, "-")}-${index}`;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Appends `children` with the first case-insensitive occurrence of `term`
 * wrapped in a `mark.search-dialog__match`, mirroring the reference's
 * `HighlightedText`. Text is inserted as text nodes only, never as HTML.
 */
function appendHighlightedText(parent: HTMLElement, children: string, term: string): void {
  const index = children.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
  if (index < 0) {
    parent.append(children);
    return;
  }
  const mark = parent.ownerDocument.createElement("mark");
  mark.className = "search-dialog__match";
  mark.textContent = children.slice(index, index + term.length);
  parent.append(children.slice(0, index), mark, children.slice(index + term.length));
}

/**
 * Binds the modal search dialog rendered by the `SearchDialog` component.
 *
 * Behavior ported from the reference controller: the sidebar search field
 * acts as the open trigger (click/focus), `Cmd/Ctrl+K` opens globally,
 * `ArrowUp/Down/Home/End` move the active option, `Enter` navigates,
 * `Escape` closes (and, outside the dialog, clears in-document highlights).
 * Selecting a result closes the dialog, opens the target's collapsed
 * section, scrolls to it, pushes the hash onto the history, and highlights
 * every match with a dismissible notice.
 *
 * @param root The document containing the rendered dialog and content.
 */
export function bindSearchDialog(root: Document): void {
  const foundDialog = root.querySelector<HTMLDialogElement>("[data-api-search-dialog]");
  if (!foundDialog) return;
  const foundInput = foundDialog.querySelector<HTMLInputElement>(
    ".search-dialog__header-search-input",
  );
  const foundClear = foundDialog.querySelector<HTMLButtonElement>(
    ".search-dialog__header-search-clear",
  );
  const foundClose = foundDialog.querySelector<HTMLButtonElement>(".api-dialog__header-close");
  const foundStatus = foundDialog.querySelector<HTMLElement>(".search-dialog__status");
  const foundResults = foundDialog.querySelector<HTMLElement>("#api-document-search-results");
  const foundEmpty = foundDialog.querySelector<HTMLElement>(".search-dialog__empty");
  const notice = root.querySelector<HTMLElement>(".api-search-highlight-notice");
  const noticeText =
    notice?.querySelector<HTMLElement>(".api-search-highlight-notice__text") ?? null;
  const noticeDismiss =
    notice?.querySelector<HTMLButtonElement>(".api-search-highlight-notice__dismiss") ?? null;
  const iconTemplates = root.querySelector<HTMLElement>("[data-pw-search-icons]");
  const trigger = root.querySelector<HTMLInputElement>("[data-pw-search]");
  if (!foundInput || !foundStatus || !foundResults || !foundEmpty || !foundClear || !foundClose) {
    return;
  }

  // Non-null aliases: the hoisted inner functions below cannot rely on the
  // early-return narrowing above, so the checked elements are rebound here.
  const dialog: HTMLDialogElement = foundDialog;
  const input: HTMLInputElement = foundInput;
  const clearButton: HTMLButtonElement = foundClear;
  const closeButton: HTMLButtonElement = foundClose;
  const status: HTMLElement = foundStatus;
  const resultsList: HTMLElement = foundResults;
  const empty: HTMLElement = foundEmpty;

  let entries: DocumentSearchEntry[] = [];
  let flatResults: DocumentSearchResult[] = [];
  let query = "";
  let activeIndex = 0;
  let closing = false;
  let pendingSelection: PendingSelection | null = null;
  let previousFocus: HTMLElement | null = null;
  let restoringFocus = false;
  let highlightedMatchCount = 0;

  /** Clones the pre-rendered Iconsax template for one result kind. */
  function resultIconSvg(kind: string): Element | null {
    const name = kind === "chapter" ? "chapter" : kind === "operation" ? "operation" : "default";
    const template = iconTemplates?.querySelector(`[data-pw-search-icon="${name}"] svg`);
    return template ? (template.cloneNode(true) as Element) : null;
  }

  function selectedIndexOf(): number {
    return flatResults.length > 0 ? Math.min(activeIndex, flatResults.length - 1) : -1;
  }

  /** Syncs `aria-selected` and `aria-activedescendant` with the active option. */
  function updateActiveOption(): void {
    const selectedIndex = selectedIndexOf();
    const options = [...resultsList.querySelectorAll<HTMLElement>('[role="option"]')];
    options.forEach((option, index) => {
      option.setAttribute("aria-selected", String(index === selectedIndex));
    });
    const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;
    if (selected) input.setAttribute("aria-activedescendant", selected.id);
    else input.removeAttribute("aria-activedescendant");
  }

  function setActiveIndex(index: number): void {
    activeIndex = index;
    updateActiveOption();
  }

  function renderResult(result: DocumentSearchResult, index: number): HTMLButtonElement {
    const option = root.createElement("button");
    option.type = "button";
    option.className = "search-dialog__result";
    option.id = optionId(result.targetId, index);
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    option.addEventListener("mousemove", () => setActiveIndex(index));
    option.addEventListener("focus", () => setActiveIndex(index));
    option.addEventListener("click", () => selectResult(result));

    const icon = root.createElement("span");
    icon.className = "search-dialog__result-icon icon-text-first-line__icon";
    const svg = resultIconSvg(result.kind);
    if (svg) icon.append(svg);

    const content = root.createElement("span");
    content.className = "search-dialog__result-content";
    const title = root.createElement("span");
    title.className = "search-dialog__result-title";
    appendHighlightedText(title, result.title, query);
    const snippet = root.createElement("span");
    snippet.className = "search-dialog__result-snippet";
    appendHighlightedText(snippet, result.snippet, result.matchedTerm);
    content.append(title, snippet);

    option.append(icon, content);
    if (result.addon) {
      const addon = root.createElement("span");
      addon.className = "search-dialog__result-addon";
      addon.textContent = result.addon;
      option.append(addon);
    }
    return option;
  }

  /** Rebuilds the grouped listbox, status line, and empty state from state. */
  function renderResults(): void {
    const groups = searchDocumentIndex(entries, query);
    flatResults = groups.flatMap((group) => group.results);
    status.textContent = query ? `${flatResults.length} results` : "Search ready";
    clearButton.hidden = !query;
    resultsList.textContent = "";

    if (query && flatResults.length > 0) {
      resultsList.hidden = false;
      empty.hidden = true;
      let resultOffset = 0;
      for (const group of groups) {
        const groupId = `api-search-group-${group.group.replace(/[^a-zA-Z0-9]+/g, "-").toLocaleLowerCase()}`;
        const groupStart = resultOffset;
        resultOffset += group.results.length;

        const section = root.createElement("section");
        section.className = "search-dialog__group";
        section.setAttribute("role", "group");
        section.setAttribute("aria-labelledby", groupId);

        const header = root.createElement("header");
        header.className = "search-dialog__group-header";
        const title = root.createElement("h3");
        title.className = "search-dialog__group-header-title";
        title.id = groupId;
        title.textContent = group.group;
        const addon = root.createElement("span");
        addon.className = "search-dialog__group-header-addon";
        addon.textContent = String(group.results.length);
        header.append(title, addon);

        const items = root.createElement("div");
        items.className = "search-dialog__group-items";
        group.results.forEach((result, localIndex) => {
          items.append(renderResult(result, groupStart + localIndex));
        });

        section.append(header, items);
        resultsList.append(section);
      }
    } else {
      resultsList.hidden = true;
      empty.hidden = false;
      empty.textContent = query
        ? "No matching documentation found."
        : "Type to search the complete API reference.";
    }
    updateActiveOption();
  }

  function setQuery(value: string): void {
    query = value;
    activeIndex = 0;
    if (input.value !== value) input.value = value;
    renderResults();
  }

  /** Shows or hides the persistent highlight notice for `count` marks. */
  function showHighlightNotice(count: number): void {
    highlightedMatchCount = count;
    if (!notice || !noticeText) return;
    if (count === 0) {
      notice.hidden = true;
      return;
    }
    noticeText.textContent = `${count} search ${count === 1 ? "match" : "matches"} highlighted`;
    notice.hidden = false;
  }

  function dismissSearchHighlights(): void {
    clearDocumentSearchHighlight(root);
    showHighlightNotice(0);
  }

  /** Opens the target's section, highlights matches, scrolls, and pushes the hash. */
  function navigateToSelection(selection: PendingSelection): void {
    const target = root.getElementById(selection.result.targetId);
    if (!target) return;
    const section = target.closest<HTMLDetailsElement>("details[data-pw-schema-card]");
    if (section) setSectionOpen(section, true);
    // Resolve the live content wrapper after the dialog closes. The indexed
    // element can become stale when browser navigation updates the document.
    const searchEntry = target.closest<HTMLElement>("[data-api-search-entry]") ?? target;
    const marks = highlightDocumentSearchMatches(searchEntry, selection.query);
    showHighlightNotice(marks.length);
    // The matched prose is the navigation affordance; focusing a heading adds an unrelated focus treatment.
    target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    window.history.pushState(null, "", `#${selection.result.targetId}`);
  }

  function finishClose(): void {
    closing = false;
    if (dialog.open) dialog.close();
    delete dialog.dataset.state;
    input.setAttribute("aria-expanded", "false");
    const selection = pendingSelection;
    pendingSelection = null;
    if (selection) {
      navigateToSelection(selection);
    } else {
      restoringFocus = true;
      previousFocus?.focus();
      restoringFocus = false;
    }
  }

  function closeDialog(selection?: PendingSelection): void {
    pendingSelection = selection ?? null;
    if (closing) return;
    closing = true;
    dialog.dataset.state = "closing";
    const duration = prefersReducedMotion() ? 0 : SEARCH_DIALOG_CLOSE_DURATION_MS;
    window.setTimeout(finishClose, duration);
  }

  function openDialog(openTrigger?: HTMLElement): void {
    const searchRoot = root.querySelector<HTMLElement>("[data-api-search-root]");
    if (!searchRoot) return;
    previousFocus = openTrigger ?? (root.activeElement as HTMLElement | null);
    entries = buildDocumentSearchIndex(searchRoot);
    closing = false;
    pendingSelection = null;
    query = "";
    activeIndex = 0;
    input.value = "";
    input.setAttribute("aria-expanded", "true");
    dialog.dataset.state = "open";
    if (!dialog.open) dialog.showModal();
    renderResults();
    window.requestAnimationFrame(() => input.focus());
  }

  function selectResult(result: DocumentSearchResult): void {
    closeDialog({ query, result });
  }

  function onSearchKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (!flatResults.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((activeIndex + direction + flatResults.length) % flatResults.length);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : flatResults.length - 1);
      return;
    }
    const selectedResult = flatResults[selectedIndexOf()];
    if (event.key === "Enter" && selectedResult) {
      event.preventDefault();
      selectResult(selectedResult);
    }
  }

  input.addEventListener("input", () => setQuery(input.value));
  input.addEventListener("keydown", onSearchKeyDown);
  clearButton?.addEventListener("click", () => setQuery(""));
  closeButton?.addEventListener("click", () => closeDialog());
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  noticeDismiss?.addEventListener("click", dismissSearchHighlights);

  root.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
      event.preventDefault();
      if (dialog.open) {
        input.focus();
        return;
      }
      openDialog();
      return;
    }
    if (event.key === "Escape" && !dialog.open && highlightedMatchCount > 0) {
      event.preventDefault();
      dismissSearchHighlights();
    }
  });

  if (trigger) {
    trigger.addEventListener("click", () => {
      if (!dialog.open) openDialog(trigger);
    });
    trigger.addEventListener("focus", () => {
      if (restoringFocus || dialog.open) return;
      openDialog(trigger);
    });
  }
}

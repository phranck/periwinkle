/**
 * Client-side controller for the statically embedded OpenAPI-contract
 * dialog, adopted from the reference `openapi-contract-dialog.ts`
 * (`apps/developer/src/lib/openapi-contract-dialog.ts`).
 *
 * The dialog opens in its loading state before the contract's already
 * highlighted Shiki markup is streamed into the DOM in line-sized chunks.
 * No click-time request is performed; the payload was placed on the page
 * at build time as a JSON `<script>` block that parses to a string of
 * pre-highlighted markup, so the inner-HTML writes below all consume
 * fully trusted, build-time-only source.
 */

/** How many highlighted lines are inserted per animation frame. */
const HIGHLIGHT_CHUNK_LINE_COUNT = 120;

/** Matches the outer <pre><code> shell and captures its inner line markup. */
const SHIKI_SHELL_PATTERN = /^(<pre\b[^>]*><code\b[^>]*>)([\s\S]*)(<\/code><\/pre>)$/;

/** Reads the build-time-only source without accepting arbitrary page markup. */
function parseDeferredContractSource(source: HTMLElement | null): string | null {
  if (!source?.textContent) return null;
  try {
    const payload: unknown = JSON.parse(source.textContent);
    return typeof payload === "string" ? payload : null;
  } catch {
    // A malformed local preview must not prevent the native dialog from
    // closing or restoring focus.
  }
  return null;
}

/**
 * Builds a detached Shiki <pre> shell that consumers can append line
 * chunks into. The markup originates from build-time Shiki output, never
 * from a runtime request or user input.
 */
function createProgressiveHighlighter(root: Document, highlighted: string) {
  const parts = highlighted.match(SHIKI_SHELL_PATTERN);
  if (!parts) return null;

  const openingMarkup = parts[1] ?? "";
  const lineMarkup = parts[2] ?? "";
  const closingMarkup = parts[3] ?? "";
  const shell = root.createElement("template");
  shell.innerHTML = `${openingMarkup}${closingMarkup}`;
  const pre = shell.content.querySelector<HTMLPreElement>("pre.shiki");
  const code = pre?.querySelector<HTMLElement>("code");
  if (!pre || !code) return null;

  return { pre, code, lines: lineMarkup.split("\n") };
}

/**
 * Binds every OpenAPI-contract dialog on the page. Idempotent: repeated
 * calls silently skip already-bound dialogs.
 *
 * The dialog closes on Escape (native cancel) or backdrop click; focus
 * returns to the trigger that opened it. The rendered CodeBlock frame is
 * populated the first time the dialog opens, then cached for subsequent
 * opens so re-entering the modal is instant.
 *
 * @param root The document containing the dialog and its triggers.
 * @returns Cleanup that removes every listener bound by this call.
 */
export function bindOpenApiContractDialog(root: Document): () => void {
  const cleanups: Array<() => void> = [];

  for (const dialog of root.querySelectorAll<HTMLDialogElement>("[data-openapi-contract-dialog]")) {
    if (dialog.dataset.openapiContractBound === "true") continue;
    dialog.dataset.openapiContractBound = "true";

    const triggers = Array.from(
      root.querySelectorAll<HTMLButtonElement>(
        `[data-openapi-contract-trigger][aria-controls="${dialog.id}"]`,
      ),
    );
    const closeControl = dialog.querySelector<HTMLButtonElement>("[data-openapi-contract-close]");
    const sourceElement = dialog.dataset.openapiContractSource
      ? root.getElementById(dialog.dataset.openapiContractSource)
      : null;
    const view = root.defaultView;
    let opener: HTMLButtonElement | null = null;
    let renderSession = 0;
    let source: string | null | undefined;
    let highlighted = false;

    const scheduleTask = (callback: () => void) => {
      if (view) view.setTimeout(callback, 0);
      else setTimeout(callback, 0);
    };
    const scheduleFrame = (callback: () => void) => {
      if (view?.requestAnimationFrame) view.requestAnimationFrame(callback);
      else setTimeout(callback, 16);
    };
    const readMotionDuration = (): number => {
      if (!view) return 0;
      const raw = view
        .getComputedStyle(dialog)
        .getPropertyValue("--pw-nav-transition-duration")
        .trim();
      const parsed = Number.parseFloat(raw);
      if (!Number.isFinite(parsed)) return 0;
      return raw.endsWith("ms") ? parsed : parsed * 1000;
    };
    let closeTimer: number | undefined;
    const close = () => {
      renderSession += 1;
      if (!dialog.open) return;
      const duration = readMotionDuration();
      if (duration <= 0) {
        dialog.close();
        return;
      }
      dialog.dataset.state = "closing";
      if (closeTimer !== undefined) view?.clearTimeout(closeTimer);
      const finalize = () => {
        closeTimer = undefined;
        dialog.close();
      };
      closeTimer = view
        ? view.setTimeout(finalize, duration)
        : (setTimeout(finalize, duration) as unknown as number);
    };
    const renderCode = (session: number) => {
      if (session !== renderSession || highlighted) return;
      const codeFrame = dialog.querySelector<HTMLElement>(".code-block__frame");
      source ??= parseDeferredContractSource(sourceElement);
      if (!codeFrame || !source) return;

      const progressiveHighlighter = createProgressiveHighlighter(root, source);
      if (!progressiveHighlighter) return;

      let nextLineIndex = 0;
      const appendHighlightChunk = () => {
        if (session !== renderSession) return;
        const lineChunk = progressiveHighlighter.lines.slice(
          nextLineIndex,
          nextLineIndex + HIGHLIGHT_CHUNK_LINE_COUNT,
        );
        const chunk = root.createElement("template");
        chunk.innerHTML = lineChunk.join("\n");
        progressiveHighlighter.code.append(chunk.content);
        nextLineIndex += lineChunk.length;

        if (nextLineIndex < progressiveHighlighter.lines.length) {
          scheduleFrame(appendHighlightChunk);
          return;
        }

        if (session === renderSession) {
          codeFrame.replaceChildren(progressiveHighlighter.pre);
          highlighted = true;
          dialog.dataset.openapiContractState = "ready";
        }
      };

      scheduleFrame(appendHighlightChunk);
    };
    const open = (trigger: HTMLButtonElement) => {
      opener = trigger;
      if (highlighted) {
        dialog.dataset.openapiContractState = "ready";
        if (!dialog.open) {
          dialog.dataset.state = "open";
          dialog.showModal();
        }
        return;
      }
      dialog.dataset.openapiContractState = "loading";
      if (!dialog.open) {
        dialog.dataset.state = "open";
        dialog.showModal();
      }
      const session = ++renderSession;
      scheduleTask(() => renderCode(session));
    };
    const onBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) close();
    };
    const onCancel = (event: Event) => {
      event.preventDefault();
      close();
    };
    const restoreFocus = () => {
      delete dialog.dataset.state;
      opener?.focus();
      opener = null;
    };

    const triggerListeners = triggers.map((trigger) => {
      const onTriggerClick = () => open(trigger);
      trigger.addEventListener("click", onTriggerClick);
      return { trigger, onTriggerClick };
    });
    closeControl?.addEventListener("click", close);
    dialog.addEventListener("click", onBackdropClick);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", restoreFocus);

    cleanups.push(() => {
      for (const { trigger, onTriggerClick } of triggerListeners) {
        trigger.removeEventListener("click", onTriggerClick);
      }
      closeControl?.removeEventListener("click", close);
      dialog.removeEventListener("click", onBackdropClick);
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", restoreFocus);
      delete dialog.dataset.openapiContractBound;
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}

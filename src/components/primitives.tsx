/**
 * Small presentational building blocks shared across the documentation UI.
 *
 * All components are pure and host-agnostic: data arrives via props, output
 * is static markup. Interactive behavior binds later through `data-pw-*`
 * attributes consumed by the client bundle.
 *
 * Trust boundary: every `dangerouslySetInnerHTML` below receives build-time
 * output of the consumer's own OpenAPI contract and periwinkle config (via
 * marked) or the Shiki highlighter. No site-visitor input ever reaches these
 * components; the produced site is fully static.
 */

import { createHash } from "node:crypto";
import type { ReactNode } from "react";

import { renderInlineMarkdown, renderMarkdown } from "../render/markdown.js";
import type { PreparedCodeBlock } from "../render/prepare.js";
import { CopyIcon, CopySuccessIcon } from "./icons.jsx";

/**
 * Renders trusted Markdown (OpenAPI prose, config content) as block HTML.
 *
 * @param props.content Markdown source text.
 * @param props.className Optional class for the wrapping container.
 */
export function Markdown({ content, className }: { content: string; className?: string }) {
  const html = renderMarkdown(content);
  if (!html) return null;
  return (
    <div
      className={className ? `pw-markdown ${className}` : "pw-markdown"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Renders trusted Markdown as inline HTML for table cells and compact rows.
 *
 * @param props.content Markdown source text.
 */
export function InlineMarkdown({ content }: { content: string }) {
  const html = renderInlineMarkdown(content);
  if (!html) return null;
  return <span className="pw-markdown-inline" dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Renders a pre-highlighted code block with the reference's line-number
 * gutter and copy control, adopted from the reference `CodeBlock.astro`:
 *
 * - The block id is a short content hash over label, language, and source,
 *   so the copy button can target its code node without inline JavaScript.
 * - The copy control reads the rendered text back from the code node; no
 *   raw source is duplicated into the page.
 * - Bash snippets skip the gutter (`language !== "bash"` gates line
 *   numbers), and blocks longer than 20 lines scroll vertically.
 * - `fillAvailable` lets the block claim the remaining viewport height of a
 *   flex parent (used by the OpenAPI-contract dialog whose body owns the
 *   scroll); the CSS token switch mirrors the reference
 *   `data-code-fill-available` recipe.
 *
 * @param props.block The prepared code block (highlighted HTML, raw source,
 *   and language) from {@link PreparedCodeBlock}.
 * @param props.label Optional label shown above the block, e.g. "Example".
 * @param props.fillAvailable Grow to fill the parent's remaining height.
 */
export function CodeBlock({
  block,
  label,
  fillAvailable,
}: {
  block: PreparedCodeBlock;
  label?: string;
  fillAvailable?: boolean;
}) {
  const blockId = `code-${createHash("sha256")
    .update(`${label ?? ""}\n${block.language}\n${block.code}`)
    .digest("hex")
    .slice(0, 12)}`;
  const lineCount = block.code.split(/\r?\n/).length;
  const hasLineNumbers = block.language !== "bash";
  const hasVerticalOverflow = lineCount > 20;

  return (
    <div
      className="code-block"
      data-code-block=""
      data-code-fill-available={fillAvailable ? "" : undefined}
    >
      {label ? <p className="code-block__label text-code mb-2">{label}</p> : null}
      <div
        className="code-block__surface"
        data-code-line-numbers={hasLineNumbers ? "" : undefined}
        data-code-vertical-scroll={hasVerticalOverflow ? "" : undefined}
      >
        <div className="code-block__actions" data-api-search-ignore="">
          <button
            type="button"
            className="code-block__copy text-fg-muted"
            aria-label="Copy code"
            title="Copy code"
            data-copy-code=""
            data-copy-target={blockId}
          >
            <span className="code-block__copy-icon-wrap" data-copy-icon="" aria-hidden="true">
              <CopyIcon className="code-block__copy-icon" aria-hidden="true" />
            </span>
            <span
              className="code-block__copy-success"
              data-copy-success=""
              hidden
              aria-hidden="true"
            >
              <CopySuccessIcon className="code-block__copy-success-icon" aria-hidden="true" />
            </span>
          </button>
        </div>
        <span className="sr-only" aria-live="polite" data-copy-status="" />
        <div
          className="content-panel code-block__frame"
          id={blockId}
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      </div>
    </div>
  );
}

/**
 * HTTP method badge with per-method accent color.
 *
 * @param props.method Uppercase HTTP method, e.g. `GET`.
 */
export function MethodBadge({ method }: { method: string }) {
  return <span className={`pw-method pw-method--${method.toLowerCase()}`}>{method}</span>;
}

/**
 * A semantic keyboard shortcut whose glyphs are individually keyed, ported
 * from the reference `KeyCap` component: one `kbd.keycap` per shortcut with
 * a square `span.keycap__key` per glyph. `Esc` renders as the `⎋` glyph
 * while the accessible label keeps the literal shortcut text.
 *
 * @param props.shortcut The shortcut text, e.g. `⌘K`, `↑↓`, `↵`, or `Esc`.
 */
export function KeyCap({ shortcut }: { shortcut: string }) {
  const displayShortcut = shortcut.toLowerCase() === "esc" ? "⎋" : shortcut;
  const keyOccurrences = new Map<string, number>();
  const keys: Array<{ id: string; label: string }> = [];
  for (const key of displayShortcut) {
    if (!key.trim()) continue;
    const label = key.toUpperCase();
    const occurrence = (keyOccurrences.get(label) ?? 0) + 1;
    keyOccurrences.set(label, occurrence);
    keys.push({ id: `${label}-${occurrence}`, label });
  }

  return (
    <kbd aria-label={shortcut} className="keycap">
      {keys.map((key) => (
        <span key={key.id} className="keycap__key">
          {key.label}
        </span>
      ))}
    </kbd>
  );
}

/**
 * One content chapter: an H2 header with icon and an entry stack, mirroring
 * the sidebar's section structure.
 *
 * @param props.id Anchor id of the chapter heading.
 * @param props.title Chapter title.
 * @param props.icon Rendered icon element for the heading.
 * @param props.children Chapter body content.
 */
export function Chapter({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="pw-chapter" aria-labelledby={id}>
      <h2 className="pw-chapter__header" id={id}>
        <span className="pw-chapter__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="pw-chapter__title">{title}</span>
      </h2>
      <div className="pw-chapter__body">{children}</div>
    </section>
  );
}

/**
 * One titled entry inside a chapter (an endpoint or schema), rendered as an
 * H3 heading followed by its content card.
 *
 * @param props.title Optional entry heading text.
 * @param props.children Entry content.
 */
export function Entry({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="pw-entry">
      {title ? <h3 className="pw-entry__title">{title}</h3> : null}
      <div className="pw-entry__content">{children}</div>
    </div>
  );
}

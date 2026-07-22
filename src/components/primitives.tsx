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

import type { ReactNode } from "react";

import { renderInlineMarkdown, renderMarkdown } from "../render/markdown.js";

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
 * Renders a pre-highlighted code block produced by the build-time Shiki pass.
 *
 * @param props.html Highlighted HTML from the build-time highlighter.
 * @param props.label Optional label shown above the block, e.g. "Example".
 */
export function CodeBlock({ html, label }: { html: string; label?: string }) {
  return (
    <figure className="pw-code-block">
      {label ? <figcaption className="pw-code-block__label">{label}</figcaption> : null}
      <div className="pw-code-block__body" dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
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

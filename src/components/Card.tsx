/**
 * Shared card compound used across the whole product so every framed surface
 * (builder settings sections, the builder preview, and the API-doc content
 * panels) is built from one normalized structure instead of three parallel,
 * hand-rolled card implementations.
 *
 * The compound owns three things:
 *
 * - `Card` — the framed container. The `variant` picks the visual weight:
 *   `elevated` is the heavy card (solid surface + border, used for the
 *   builder's settings and preview panels) and `inset` is the light,
 *   semi-transparent panel embedded inside API-doc endpoint blocks.
 * - `Card.Header` — the header bar. It carries the shared flex/padding recipe
 *   and, on elevated cards, a fixed minimum height so sibling card headers
 *   line up pixel-for-pixel regardless of what their content weighs. It is
 *   polymorphic via `as` so a header can render as a `<button>` (collapsible
 *   sections), a plain `<div>` (static toolbars), or any other element.
 * - `Card.Body` — the content region below the header.
 *
 * Consumers keep their own modifier classes (for example `section__summary` or
 * `pw-cb__preview-header`) for the few genuinely local differences; everything
 * structural lives on the shared `pw-card*` classes.
 */

import type { ElementType, HTMLAttributes } from "react";
import { cx } from "./classnames.js";

/** Visual weight of the card frame. */
export type CardVariant = "elevated" | "inset";

interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Element to render as (`div` by default, e.g. `aside` for the preview). */
  as?: ElementType;
  /** Visual weight of the frame. Defaults to the heavy `elevated` card. */
  variant?: CardVariant;
}

/**
 * Framed card container.
 *
 * @param props.as Element type to render (`div` default; e.g. `aside` for the
 *   builder preview so its landmark semantics stay intact).
 * @param props.variant Visual weight (`elevated` heavy card, `inset` light
 *   embedded panel). Defaults to `elevated`.
 * @param props.className Additional modifier classes appended to the base.
 * @remarks Arbitrary `data-*`, `id`, and ARIA attributes pass through so
 *   scroll targets, search-index hooks, and client-side bindings can attach.
 */
function CardRoot({
  as: Tag = "div",
  variant = "elevated",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag className={cx(`pw-card pw-card--${variant}`, className)} {...rest}>
      {children}
    </Tag>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLElement> {
  /** Element to render as (`div` by default, `button` for collapsible headers). */
  as?: ElementType;
  /** Button type, forwarded when the header renders as a `<button>`. */
  type?: "button" | "submit" | "reset";
}

/**
 * Card header bar. Renders the shared header recipe on whichever element the
 * caller picks via `as`.
 *
 * @param props.as Element type to render (`div` default, `button` for
 *   collapsible section summaries).
 * @param props.className Additional modifier classes appended to the base.
 * @remarks ARIA and `data-*` attributes pass through so toggle/persistence
 *   bindings and `aria-expanded`/`aria-controls` wiring stay on the header.
 */
function CardHeader({ as: Tag = "div", className, children, ...rest }: CardHeaderProps) {
  return (
    <Tag className={cx("pw-card__header", className)} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Card content region below the header.
 *
 * @param props.className Additional modifier classes appended to the base.
 */
function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("pw-card__body", className)} {...rest}>
      {children}
    </div>
  );
}

/** Compound card: `Card` root with `Card.Header` and `Card.Body` slots. */
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
});

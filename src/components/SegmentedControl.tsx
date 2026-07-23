/**
 * Reusable segmented-control primitive adopted from the reference developer
 * portal (`apps/developer/src/components/SegmentedControl.tsx`).
 *
 * The component owns only the shared surface and its item slots; call sites
 * decide the semantics (`role="tablist"`/`role="tab"`, `aria-*`, `tabIndex`)
 * and the state attributes. Panel visibility, keyboard navigation, and
 * `aria-selected` bookkeeping stay with the client controller.
 *
 * The wrapper renders a `<div>` with the shared `segmented-control` class;
 * each `Item` renders a `<button>` with `segmented-control__item`. Optional
 * `Icon` and `Label` subcomponents mirror the reference compound so an item
 * can host an icon before its text label without extra wrappers.
 */

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/** Extra classes stacked onto the shared root class. */
type WithClassName<T> = T & { className?: string; children?: ReactNode };

function joinClasses(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base;
}

/**
 * Root of the segmented control. Renders a `<div>` with
 * `class="segmented-control"`; call sites add `role="tablist"` and an
 * accessible label.
 */
function SegmentedControlRoot({
  className,
  children,
  ...rest
}: WithClassName<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={joinClasses("segmented-control", className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * One selectable segment inside the control. Renders a `<button>` with
 * `class="segmented-control__item"`; call sites decide `role`,
 * `aria-selected`, `tabIndex`, and any `data-*` selectors the controller
 * needs.
 */
function SegmentedControlItem({
  className,
  children,
  type = "button",
  ...rest
}: WithClassName<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button type={type} className={joinClasses("segmented-control__item", className)} {...rest}>
      {children}
    </button>
  );
}

/**
 * Optional icon slot rendered before the item label. Adopted so future call
 * sites can add icons without introducing another wrapper.
 */
function SegmentedControlItemIcon({
  className,
  children,
  ...rest
}: WithClassName<HTMLAttributes<HTMLSpanElement>>) {
  return (
    <span className={joinClasses("segmented-control__item-icon", className)} {...rest}>
      {children}
    </span>
  );
}

/** Optional label slot for the segment's text. */
function SegmentedControlItemLabel({
  className,
  children,
  ...rest
}: WithClassName<HTMLAttributes<HTMLSpanElement>>) {
  return (
    <span className={joinClasses("segmented-control__item-label", className)} {...rest}>
      {children}
    </span>
  );
}

/**
 * Compound API mirroring the reference component: `<SegmentedControl>` with
 * `Item`, `Item.Icon`, `Item.Label` on it.
 */
export const SegmentedControl = Object.assign(SegmentedControlRoot, {
  Item: Object.assign(SegmentedControlItem, {
    Icon: SegmentedControlItemIcon,
    Label: SegmentedControlItemLabel,
  }),
});

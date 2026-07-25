/**
 * Central icon module.
 *
 * periwinkle renders Iconsax icons in the Bulk style — the same set and
 * style the reference design uses. Every icon used anywhere in the UI is
 * bound and re-exported here so the style decision (variant + color
 * inheritance) lives in exactly one place:
 *
 * - `variant="Bulk"`: the chosen Iconsax style.
 * - `color="currentColor"`: iconsax-react has no color default; without
 *   this the SVG paths carry `stroke: undefined` and render invisible.
 *   Binding `currentColor` lets the surrounding text color drive the icon.
 * - `pw-icon` class: styles.css lifts the Bulk secondary layer's hardcoded
 *   `opacity=".4"` so the two-tone contrast stays readable on dark surfaces.
 */

import * as iconsax from "iconsax-react";
import {
  ArrowCircleDown,
  ArrowCircleUp,
  Book,
  Book1,
  Category,
  CloseCircle,
  Code,
  Copy,
  CopySuccess,
  Data,
  Diagram,
  type Icon,
  type IconProps,
  Key,
  Moon,
  SearchNormal1,
  SearchStatus,
  Send2,
  Sun1,
  TickCircle,
  Warning2,
} from "iconsax-react";
import type { FC } from "react";

/**
 * Allows `data-*` hooks on bound icons (e.g. the copy control's
 * `data-copy-icon`), mirroring the reference's compound-element typing;
 * iconsax's own `IconProps` has no data-attribute index signature.
 */
type DataAttributes = {
  [attribute: `data-${string}`]: unknown;
};

/**
 * A bound icon component: Iconsax props plus `data-*` passthrough. Consumers
 * that accept icons as props type them as `BoundIcon` (not iconsax's `Icon`),
 * because the added data-attribute signature makes the two non-interchangeable.
 */
export type BoundIcon = FC<IconProps & DataAttributes>;

/**
 * Binds the periwinkle icon policy (Bulk + currentColor + `pw-icon` class)
 * onto an Iconsax icon and returns a drop-in component that only needs
 * `className`/`aria-*`/`data-*`.
 *
 * @param Base The raw iconsax-react icon component.
 * @returns The pre-styled icon component.
 */
function bulk(Base: Icon, variant: IconVariant = "Bulk"): BoundIcon {
  const Bound: BoundIcon = ({ className, ...rest }) => (
    <Base
      variant={variant}
      color="currentColor"
      className={className ? `pw-icon ${className}` : "pw-icon"}
      {...rest}
    />
  );
  Bound.displayName = `${variant}(${Base.displayName ?? Base.name ?? "Icon"})`;
  return Bound;
}

/**
 * Icon styles periwinkle renders. `Bulk` is the default; `TwoTone` is offered
 * because some marks read better in it at sidebar size.
 */
export type IconVariant = "Bulk" | "TwoTone";

/**
 * Resolves an Iconsax icon by name and binds the periwinkle icon policy onto
 * it. Used for icons chosen through configuration or the section-icon
 * mapping, where the name is only known at build time.
 *
 * Results are cached so a repeated name reuses one bound component instead
 * of creating a new one per render.
 *
 * @param name The Iconsax icon name, e.g. `"Shop"`.
 * @param variant Icon style; defaults to `Bulk`.
 * @returns The bound icon, or `undefined` when no such icon exists.
 */
export function iconByName(name: string, variant: IconVariant = "Bulk"): BoundIcon | undefined {
  const cacheKey = `${name}:${variant}`;
  const cached = boundByName.get(cacheKey);
  if (cached) return cached;
  const candidate = (iconsax as Record<string, unknown>)[name];
  if (typeof candidate !== "function" && typeof candidate !== "object") return undefined;
  if (candidate === null) return undefined;
  const bound = bulk(candidate as Icon, variant);
  boundByName.set(cacheKey, bound);
  return bound;
}

const boundByName = new Map<string, BoundIcon>();

export const ArrowCircleDownIcon = bulk(ArrowCircleDown);
export const ArrowCircleUpIcon = bulk(ArrowCircleUp);
export const Book1Icon = bulk(Book1);
export const BookIcon = bulk(Book);
export const CategoryIcon = bulk(Category);
export const CloseCircleIcon = bulk(CloseCircle);
export const CodeIcon = bulk(Code);
export const CopyIcon = bulk(Copy);
export const CopySuccessIcon = bulk(CopySuccess);
export const DataIcon = bulk(Data);
export const DiagramIcon = bulk(Diagram);
export const KeyIcon = bulk(Key);
export const MoonIcon = bulk(Moon);
export const SearchNormal1Icon = bulk(SearchNormal1);
export const SearchStatusIcon = bulk(SearchStatus);
export const Send2Icon = bulk(Send2);
export const Sun1Icon = bulk(Sun1);
export const TickCircleIcon = bulk(TickCircle);
export const Warning2Icon = bulk(Warning2);

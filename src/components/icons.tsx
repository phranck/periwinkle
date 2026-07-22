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

import {
  ArrowCircleDown,
  ArrowCircleUp,
  Book,
  Book1,
  Category,
  Code,
  type Icon,
  type IconProps,
  Key,
  Moon,
  SearchNormal1,
  Send2,
  Sun1,
  TickCircle,
  Warning2,
} from "iconsax-react";

/**
 * Binds the periwinkle icon policy (Bulk + currentColor + `pw-icon` class)
 * onto an Iconsax icon and returns a drop-in component that only needs
 * `className`/`aria-*`.
 *
 * @param Base The raw iconsax-react icon component.
 * @returns The pre-styled icon component.
 */
function bulk(Base: Icon): Icon {
  const Bound = ({ className, ...rest }: IconProps) => (
    <Base
      variant="Bulk"
      color="currentColor"
      className={className ? `pw-icon ${className}` : "pw-icon"}
      {...rest}
    />
  );
  Bound.displayName = `Bulk(${Base.displayName ?? Base.name ?? "Icon"})`;
  return Bound;
}

export const ArrowCircleDownIcon = bulk(ArrowCircleDown);
export const ArrowCircleUpIcon = bulk(ArrowCircleUp);
export const Book1Icon = bulk(Book1);
export const BookIcon = bulk(Book);
export const CategoryIcon = bulk(Category);
export const CodeIcon = bulk(Code);
export const KeyIcon = bulk(Key);
export const MoonIcon = bulk(Moon);
export const SearchNormal1Icon = bulk(SearchNormal1);
export const Send2Icon = bulk(Send2);
export const Sun1Icon = bulk(Sun1);
export const TickCircleIcon = bulk(TickCircle);
export const Warning2Icon = bulk(Warning2);

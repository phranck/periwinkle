/**
 * Class-name helper shared by the card compounds so the same join logic is
 * defined once instead of being copied into every component.
 */

/**
 * Join a required base class with an optional caller-supplied class.
 *
 * @param base The always-present base class(es).
 * @param extra Optional additional classes appended after a single space.
 * @returns The combined class string, or just `base` when `extra` is empty.
 */
export function cx(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base;
}

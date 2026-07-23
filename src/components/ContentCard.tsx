/**
 * Structured card primitive for the reference content area.
 *
 * Adopted verbatim from the reference `ContentCard` compound
 * (`apps/developer/src/components/docs/ContentCard.tsx`): every consumer
 * shares one card treatment — outer radius, chrome header, body grid, and
 * footer — instead of rebuilding individual rounded-card layouts. Surface
 * geometry and spacing live in `styles.css`.
 *
 * Usage:
 * ```tsx
 * <ContentCard>
 *   <ContentCard.Header>
 *     <ContentCard.Header.Title>Integration essentials</ContentCard.Header.Title>
 *   </ContentCard.Header>
 *   <ContentCard.Body>
 *     <ContentCard.Body.Stack>...</ContentCard.Body.Stack>
 *   </ContentCard.Body>
 * </ContentCard>
 * ```
 */

import type { ReactNode } from "react";

interface BaseProps {
  className?: string;
  children?: ReactNode;
}

function cx(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base;
}

/**
 * Card root. Wraps content in the shared `surface-card content-card` shell
 * with concentric rounded corners.
 */
function ContentCardRoot({ className, children }: BaseProps) {
  return <article className={cx("surface-card content-card", className)}>{children}</article>;
}

function ContentCardHeader({ className, children }: BaseProps) {
  return <header className={cx("content-card__header", className)}>{children}</header>;
}

function ContentCardHeaderAddon({ className, children }: BaseProps) {
  return <div className={cx("content-card__header-addon", className)}>{children}</div>;
}

function ContentCardTitle({ className, children }: BaseProps) {
  return <h3 className={cx("content-card__title", className)}>{children}</h3>;
}

function ContentCardBody({ className, children }: BaseProps) {
  return <div className={cx("content-card__body", className)}>{children}</div>;
}

function ContentCardBodyIntro({ className, children }: BaseProps) {
  return <div className={cx("content-card__body-intro", className)}>{children}</div>;
}

function ContentCardBodyCopy({ className, children }: BaseProps) {
  return <div className={cx("content-card__copy", className)}>{children}</div>;
}

function ContentCardBodyStack({ className, children }: BaseProps) {
  return <div className={cx("content-card__body-stack", className)}>{children}</div>;
}

function ContentCardFooter({ className, children }: BaseProps) {
  return <footer className={cx("content-card__footer", className)}>{children}</footer>;
}

/**
 * Compound card API used by structured technical content. Mirrors the slot
 * shape of the reference `ContentCard`; unused slots (Section) are omitted
 * because periwinkle's default guide does not use nested sections.
 */
export const ContentCard = Object.assign(ContentCardRoot, {
  Header: Object.assign(ContentCardHeader, {
    Addon: ContentCardHeaderAddon,
    Title: ContentCardTitle,
  }),
  Body: Object.assign(ContentCardBody, {
    Intro: ContentCardBodyIntro,
    Copy: ContentCardBodyCopy,
    Stack: ContentCardBodyStack,
  }),
  Footer: ContentCardFooter,
});

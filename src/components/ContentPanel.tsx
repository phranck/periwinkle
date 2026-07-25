/**
 * Shared inner-surface compound for content nested inside a ContentCard.
 *
 * Adopted verbatim from the reference `ContentPanel` compound
 * (`apps/developer/src/components/docs/ContentPanel.tsx`): the panel owns
 * the derived radius and border recipe so nested cards, integration facts,
 * and code frames stay geometrically consistent.
 */

import type { HTMLAttributes, ReactNode } from "react";
import { Card } from "./Card.jsx";
import { cx } from "./classnames.js";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

interface BaseProps {
  className?: string;
  children?: ReactNode;
}

/**
 * Panel root. The light, semi-transparent frame is the shared `Card`'s
 * `inset` variant, so content panels and the builder cards resolve to one
 * card primitive. Accepts `id` and arbitrary `data-*` attributes so search
 * indexing hooks and scroll targets can attach where needed.
 */
function ContentPanelRoot({ className, children, ...rest }: PanelProps) {
  return (
    <Card variant="inset" className={className} {...rest}>
      {children}
    </Card>
  );
}

function ContentPanelHeader({ className, children }: BaseProps) {
  return <div className={cx("content-panel__header", className)}>{children}</div>;
}

function ContentPanelHeaderTitle({ className, children }: BaseProps) {
  return <h3 className={cx("content-panel__header-title", className)}>{children}</h3>;
}

function ContentPanelContent({ className, children }: BaseProps) {
  return <div className={cx("content-panel__content", className)}>{children}</div>;
}

function ContentPanelFooter({ className, children }: BaseProps) {
  return <div className={cx("content-panel__footer", className)}>{children}</div>;
}

/**
 * Compound inner panel shared by the Integration essentials grid and any
 * future in-card panels. Header/Content/Footer stay optional so consumers
 * can render minimal, header-less panels when needed.
 */
export const ContentPanel = Object.assign(ContentPanelRoot, {
  Header: Object.assign(ContentPanelHeader, {
    Title: ContentPanelHeaderTitle,
  }),
  Content: ContentPanelContent,
  Footer: ContentPanelFooter,
});

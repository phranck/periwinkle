/**
 * Build-time OpenAPI contract viewer, adopted from the reference
 * `OpenApiContractDialog` compound
 * (`apps/developer/src/components/docs/OpenApiContractDialog.tsx`).
 *
 * The dialog is a native `<dialog>` inside the surface-card shell; its
 * lazy-loaded JSON body is highlighted by Shiki at build time and streamed
 * into the DOM on first open by `bindOpenApiContractDialog()`. The trigger
 * lives inside the Integration essentials grid; a caller only needs to
 * embed the trigger and the dialog together (both are aria-wired via
 * `aria-controls`/`id`).
 */

import type { ReactNode } from "react";
import { CloseCircleIcon, CodeIcon } from "./icons.jsx";

interface DialogProps {
  /** DOM id used by the trigger's `aria-controls`. */
  id: string;
  /** Id of the accessible title inside the header. */
  titleId: string;
  /** DOM id of the `<script type="application/json">` payload holder. */
  sourceElementId: string;
  /** Dialog title text ("Public OpenAPI contract, v1.2.3"). */
  title: string;
  /** Rendered CodeBlock body, deferred until the dialog opens. */
  children: ReactNode;
}

/**
 * Renders the surface-card dialog frame and delegates the JSON body to
 * `children`. The dialog is closed by default; the client binder opens it
 * with `showModal()` on trigger click and closes it on Escape or backdrop.
 */
export function OpenApiContractDialog({
  id,
  titleId,
  sourceElementId,
  title,
  children,
}: DialogProps) {
  return (
    <dialog
      id={id}
      className="api-dialog surface-card openapi-contract-dialog"
      aria-labelledby={titleId}
      data-openapi-contract-dialog=""
      data-openapi-contract-source={sourceElementId}
      data-openapi-contract-state="loading"
      data-api-search-ignore=""
    >
      <header className="api-dialog__header openapi-contract-dialog__header">
        <h2 id={titleId} className="openapi-contract-dialog__header-title">
          {title}
        </h2>
        <div className="api-dialog__header-addon openapi-contract-dialog__header-addon">
          <button
            type="button"
            className="openapi-contract-dialog__close"
            aria-label="Close OpenAPI contract"
            title="Close OpenAPI contract"
            data-openapi-contract-close=""
          >
            <CloseCircleIcon className="openapi-contract-dialog__close-icon" aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="api-dialog__body openapi-contract-dialog__body">
        <div
          className="openapi-contract-dialog__loading"
          role="status"
          data-openapi-contract-loading=""
        >
          <span className="openapi-contract-dialog__loading-spinner" aria-hidden="true" />
          <span className="sr-only">Loading OpenAPI contract</span>
        </div>
        {children}
      </div>
    </dialog>
  );
}

/**
 * Trigger button used inside the Integration essentials grid. Keeps the
 * aria wiring (`aria-controls`, `aria-haspopup="dialog"`) and the sentinel
 * `data-openapi-contract-trigger` attribute the client binder targets.
 */
export function OpenApiContractDialogTrigger({ dialogId }: { dialogId: string }) {
  return (
    <button
      type="button"
      className="openapi-contract-dialog__trigger"
      aria-controls={dialogId}
      aria-haspopup="dialog"
      data-openapi-contract-trigger=""
    >
      <CodeIcon className="size-5" aria-hidden="true" />
      View OpenAPI contract
    </button>
  );
}

/**
 * Statically rendered modal search surface, adopted from the reference
 * implementation's `SearchDialog`/`ApiDialog` compounds.
 *
 * The markup (classes, roles, ids) matches the reference exactly; all state
 * — opening, query, grouped results, keyboard navigation, and the highlight
 * notice — is driven by `bindSearchDialog` in the client bundle. Hidden
 * Iconsax templates ship alongside the dialog so the framework-free client
 * can clone the correct result icon per entry kind.
 */

import { BookIcon, CloseCircleIcon, CodeIcon, DiagramIcon, SearchNormal1Icon } from "./icons.jsx";
import { KeyCap } from "./primitives.jsx";

/**
 * The complete search overlay: the native `dialog` (header with search
 * field and close control, listbox body, keyboard-hint footer), the
 * persistent highlight notice, and the hidden result-icon templates.
 *
 * Rendered once at the end of the page shell; `bindSearchDialog` wires the
 * behavior.
 */
export function SearchDialog() {
  return (
    <>
      <dialog
        className="api-dialog surface-card search-dialog"
        aria-label="Search API reference"
        data-api-search-dialog=""
      >
        <header className="api-dialog__header">
          <h2 className="api-dialog__header-title sr-only">Search API reference</h2>
          <div className="search-dialog__header-search">
            <span className="search-dialog__header-search-icon">
              <SearchNormal1Icon className="size-5" aria-hidden="true" />
            </span>
            <input
              type="search"
              className="search-dialog__header-search-input"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="api-document-search-results"
              aria-expanded="false"
              aria-label="Search API reference"
              placeholder="Search the API reference"
              autoComplete="off"
            />
            <button
              type="button"
              className="search-dialog__header-search-clear"
              aria-label="Clear search"
              title="Clear search"
              hidden
            >
              <CloseCircleIcon className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="api-dialog__header-addon">
            <button
              type="button"
              className="api-dialog__header-close search-dialog__header-close"
              aria-label="Close search"
              title="Close search"
            >
              <CloseCircleIcon className="size-6" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="api-dialog__body">
          <p className="search-dialog__status sr-only" aria-live="polite">
            Search ready
          </p>
          <div
            role="listbox"
            className="search-dialog__results"
            id="api-document-search-results"
            hidden
          />
          <div className="search-dialog__empty">Type to search the complete API reference.</div>
        </div>

        <footer className="api-dialog__footer">
          <div className="search-dialog__footer-hints">
            <span className="search-dialog__footer-hint">
              <KeyCap shortcut="↑↓" />
              Navigate
            </span>
            <span className="search-dialog__footer-hint">
              <KeyCap shortcut="↵" />
              Open
            </span>
            <span className="search-dialog__footer-hint">
              <KeyCap shortcut="Esc" />
              Close
            </span>
          </div>
        </footer>
      </dialog>

      <aside className="api-search-highlight-notice" role="status" aria-live="polite" hidden>
        <span className="api-search-highlight-notice__text" />
        <KeyCap shortcut="Esc" />
        <button
          type="button"
          className="api-search-highlight-notice__dismiss"
          aria-label="Clear search highlights"
          title="Clear search highlights"
        >
          <CloseCircleIcon className="size-5" aria-hidden="true" />
        </button>
      </aside>

      <div data-pw-search-icons="" hidden aria-hidden="true">
        <span data-pw-search-icon="chapter">
          <BookIcon aria-hidden="true" />
        </span>
        <span data-pw-search-icon="operation">
          <DiagramIcon aria-hidden="true" />
        </span>
        <span data-pw-search-icon="default">
          <CodeIcon aria-hidden="true" />
        </span>
      </div>
    </>
  );
}

/**
 * Sidebar navigation for the generated reference, adopted 1:1 from the
 * reference `Sidebar` compound + `ApiReferenceNav` markup: a `sidebar
 * api-reference-nav surface-card` nav whose glass header overlaps the
 * scrollable `sidebar__body`, top-level chapter links, and one collapsible
 * `details` section per endpoint group plus the schemas section. Sections
 * use native `details`/`summary` so the rail works without JavaScript; the
 * client bundle enhances them with persisted open state, the animated
 * expand/collapse, the expand/collapse-all control, the header scroll
 * shadow, and the theme toggle via the `data-pw-*` hooks.
 *
 * The header layout mirrors the reference `Sidebar.Header` exactly: the
 * fixed chapter title "Reference" sits on the left, and the addon cluster
 * on the right carries the expand/collapse-all chevron button. periwinkle
 * additions: the theme toggle sits next to the toggle-all button (spatially
 * separated by a gap so the two never read as one control), and the search
 * trigger field lives on a second row inside the header — the reference's
 * search dialog is triggered from a global affordance which periwinkle
 * embeds directly in the sidebar for convenience.
 *
 * Top-level links mirror the content's document order exactly (custom
 * sections before the guide link when placed `before-guide`, and so on);
 * both sides derive that order from `customSectionsAt()`.
 */

import type { CustomSection } from "../config/config.js";
import type { ApiOperation } from "../model/api-reference.js";
import { customSectionsAt, type DocsData } from "../render/prepare.js";
import {
  ArrowCircleDownIcon,
  Book1Icon,
  BookIcon,
  type BoundIcon,
  CategoryIcon,
  CodeIcon,
  MoonIcon,
  SearchNormal1Icon,
  Sun1Icon,
} from "./icons.jsx";
import { KeyCap } from "./primitives.jsx";

function operationDescription(operation: ApiOperation): string {
  return operation.summary ?? operation.operationId ?? `${operation.method} ${operation.path}`;
}

function operationSearchText(operation: ApiOperation): string {
  return `${operation.navTitle} ${operationDescription(operation)} ${operation.method} ${operation.path}`.toLowerCase();
}

function sectionKey(name: string): string {
  return name.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
}

function NavItem({
  href,
  searchText,
  title,
  ariaLabel,
  method,
  children,
}: {
  href: string;
  searchText: string;
  title?: string;
  ariaLabel?: string;
  /**
   * Optional HTTP method rendered as a small right-aligned text label in the
   * method's accent color. Accepted periwinkle addition on top of the
   * reference (which shows only the nav title): a method hint next to each
   * operation makes the sidebar scannable without opening every group.
   */
  method?: string;
  children: React.ReactNode;
}) {
  return (
    <li className="sidebar__section-item">
      <a
        className="api-reference-nav__link pw-nav__item text-body"
        href={href}
        title={title}
        aria-label={ariaLabel}
        data-pw-nav-item
        data-pw-search-text={searchText}
      >
        <span className="pw-nav__item-title truncate">{children}</span>
        {method ? (
          <span className={`pw-nav__item-method pw-nav__item-method--${method.toLowerCase()}`}>
            {method}
          </span>
        ) : null}
      </a>
    </li>
  );
}

function NavSection({
  name,
  count,
  icon: SectionIcon,
  searchText,
  children,
}: {
  name: string;
  count: number;
  icon: BoundIcon;
  searchText: string;
  children: React.ReactNode;
}) {
  return (
    <details
      className="sidebar__section api-reference-nav__section"
      data-pw-nav-section={sectionKey(name)}
      data-pw-search-text={searchText}
    >
      <summary className="sidebar__section-header api-reference-nav__summary">
        <SectionIcon className="api-reference-nav__section-icon size-5" aria-hidden="true" />
        <h3 className="sidebar__section-header-title api-reference-nav__summary-title">{name}</h3>
        <div className="sidebar__section-header-addons api-reference-nav__summary-addons">
          <span className="api-reference-nav__count">{count}</span>
          <span className="api-reference-nav__toggle pw-chevron" aria-hidden="true">
            <ArrowCircleDownIcon />
          </span>
        </div>
      </summary>
      <div className="api-reference-nav__content">
        <ul className="sidebar__section-items">{children}</ul>
      </div>
    </details>
  );
}

function TopLink({
  href,
  icon: LinkIcon,
  searchText,
  children,
}: {
  href: string;
  icon: BoundIcon;
  searchText?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className="sidebar__chapter api-reference-nav__top-link api-reference-nav__link text-body"
      href={href}
      data-pw-nav-item
      data-pw-search-text={searchText}
    >
      <LinkIcon className="api-reference-nav__section-icon size-5" aria-hidden="true" />
      <span>{children}</span>
    </a>
  );
}

function CustomSectionLink({ section }: { section: CustomSection }) {
  return (
    <TopLink href={`#${section.id}`} icon={Book1Icon} searchText={section.title.toLowerCase()}>
      {section.title}
    </TopLink>
  );
}

/**
 * The complete sidebar: glass header (brand row with expand/collapse-all
 * and theme toggles plus the search trigger with its `⌘K` key caps),
 * scrollable body with top-level links in document order, one collapsible
 * section per endpoint group, and the schemas section.
 *
 * @param props.data The prepared docs data.
 */
export function SidebarNav({ data }: { data: DocsData }) {
  const { reference, config } = data;
  const schemas = Object.values(reference.schemas);
  const hasGuide = data.guideSections.length > 0;
  // The reference sidebar renders no logo. periwinkle keeps the option so
  // consumers can brand the surface; when set the mark sits next to the
  // fixed chapter title without changing the two-column header grid.
  const logo = config.site.logo;

  return (
    <nav
      className="sidebar api-reference-nav surface-card"
      aria-label="API reference sections"
      data-pw-nav
    >
      <header className="sidebar__header">
        <div className="sidebar__header-chapter">
          <h2 className="sidebar__header-title">
            {logo ? <img className="pw-nav__logo" src={logo} alt="" /> : null}
            <span className="pw-nav__brand-title">Reference</span>
          </h2>
          <div className="sidebar__header-addon">
            <button
              type="button"
              className="api-reference-nav__toggle-all"
              aria-label="Expand all sections"
              title="Expand all sections"
              data-pw-toggle-all
            >
              <ArrowCircleDownIcon aria-hidden="true" />
            </button>
            <button
              type="button"
              className="pw-nav__icon-button"
              aria-label="Toggle color scheme"
              title="Toggle color scheme"
              data-pw-theme-toggle
            >
              <Sun1Icon
                className="pw-nav__theme-icon pw-nav__theme-icon--light"
                aria-hidden="true"
              />
              <MoonIcon
                className="pw-nav__theme-icon pw-nav__theme-icon--dark"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
        <label className="pw-nav__search">
          <span className="pw-nav__search-icon">
            <SearchNormal1Icon className="size-5" aria-hidden="true" />
          </span>
          <input
            className="pw-nav__search-input"
            type="search"
            id="pw-search"
            name="pw-search"
            placeholder="Search the API reference"
            aria-label="Search API reference"
            readOnly
            data-pw-search
          />
          <KeyCap shortcut="⌘K" />
        </label>
      </header>
      <div className="sidebar__body" data-pw-nav-body>
        {customSectionsAt(config, "before-guide").map((section) => (
          <CustomSectionLink section={section} key={section.id} />
        ))}
        {hasGuide ? (
          <TopLink href="#integration-guide" icon={BookIcon}>
            Integration guide
          </TopLink>
        ) : null}
        {customSectionsAt(config, "after-guide").map((section) => (
          <CustomSectionLink section={section} key={section.id} />
        ))}
        {reference.groups.map((group) => (
          <NavSection
            key={group.name}
            name={group.name}
            count={group.operations.length}
            icon={CategoryIcon}
            searchText={`${group.name} ${group.operations.map(operationSearchText).join(" ")}`.toLowerCase()}
          >
            {group.operations.map((operation) => (
              <NavItem
                key={operation.anchor}
                href={`#${operation.anchor}`}
                title={operationDescription(operation)}
                ariaLabel={`${operation.navTitle}: ${operationDescription(operation)}`}
                searchText={operationSearchText(operation)}
                method={operation.method}
              >
                {operation.navTitle}
              </NavItem>
            ))}
          </NavSection>
        ))}
        {schemas.length > 0 ? (
          <NavSection
            name="Schemas"
            count={schemas.length}
            icon={CodeIcon}
            searchText={`schemas ${schemas.map((schema) => schema.name).join(" ")}`.toLowerCase()}
          >
            {schemas.map((schema) => (
              <NavItem
                key={schema.anchor}
                href={`#${schema.anchor}`}
                title={schema.name}
                searchText={schema.name.toLowerCase()}
              >
                {schema.name}
              </NavItem>
            ))}
          </NavSection>
        ) : null}
        {customSectionsAt(config, "after-reference").map((section) => (
          <CustomSectionLink section={section} key={section.id} />
        ))}
      </div>
    </nav>
  );
}

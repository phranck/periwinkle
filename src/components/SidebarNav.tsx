/**
 * Sidebar navigation for the generated reference.
 *
 * Sections use native `details`/`summary` so the rail works without
 * JavaScript; the client bundle enhances them with persisted open state,
 * search filtering, the expand/collapse-all control, and the theme toggle
 * via the `data-pw-*` hooks. Endpoint paths stay out of the rail to keep it
 * scannable — items show the operation's navigation title with a method
 * badge.
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
  ArrowCircleUpIcon,
  Book1Icon,
  BookIcon,
  CategoryIcon,
  CodeIcon,
  MoonIcon,
  SearchNormal1Icon,
  Sun1Icon,
} from "./icons.jsx";
import { MethodBadge } from "./primitives.jsx";

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
  children,
}: {
  href: string;
  searchText: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <a
        className="pw-nav__item"
        href={href}
        title={title}
        data-pw-nav-item
        data-pw-search-text={searchText}
      >
        {children}
      </a>
    </li>
  );
}

function NavSection({
  name,
  count,
  icon,
  searchText,
  children,
}: {
  name: string;
  count: number;
  icon: React.ReactNode;
  searchText: string;
  children: React.ReactNode;
}) {
  return (
    <details
      className="pw-nav__section"
      data-pw-nav-section={sectionKey(name)}
      data-pw-search-text={searchText}
    >
      <summary className="pw-nav__summary">
        <span className="pw-nav__section-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="pw-nav__summary-title">{name}</span>
        <span className="pw-nav__count">{count}</span>
        <ArrowCircleDownIcon className="pw-nav__chevron" aria-hidden="true" />
      </summary>
      <ul className="pw-nav__items">{children}</ul>
    </details>
  );
}

function CustomSectionLink({ section }: { section: CustomSection }) {
  return (
    <a
      className="pw-nav__item pw-nav__item--top"
      href={`#${section.id}`}
      data-pw-nav-item
      data-pw-search-text={section.title.toLowerCase()}
    >
      <Book1Icon className="pw-nav__section-icon" aria-hidden="true" />
      <span>{section.title}</span>
    </a>
  );
}

/**
 * The complete sidebar: brand row with expand/collapse-all and theme
 * toggles, search input, top-level links in document order, one collapsible
 * section per endpoint group, and the schemas section.
 *
 * @param props.data The prepared docs data.
 */
export function SidebarNav({ data }: { data: DocsData }) {
  const { reference, config } = data;
  const schemas = Object.values(reference.schemas);
  const hasGuide = data.guideSections.length > 0;
  const logo = config.site.logo;

  return (
    <nav className="pw-nav" aria-label="API reference sections" data-pw-nav>
      <div className="pw-nav__brand">
        {logo ? <img className="pw-nav__logo" src={logo} alt="" /> : null}
        <span className="pw-nav__brand-title">{data.title}</span>
        <button
          type="button"
          className="pw-nav__icon-button"
          aria-label="Expand all sections"
          title="Expand all sections"
          data-pw-toggle-all
        >
          <ArrowCircleDownIcon className="pw-nav__toggle-all-down" aria-hidden="true" />
          <ArrowCircleUpIcon className="pw-nav__toggle-all-up" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="pw-nav__icon-button"
          aria-label="Toggle color scheme"
          title="Toggle color scheme"
          data-pw-theme-toggle
        >
          <Sun1Icon className="pw-nav__theme-icon pw-nav__theme-icon--light" aria-hidden="true" />
          <MoonIcon className="pw-nav__theme-icon pw-nav__theme-icon--dark" aria-hidden="true" />
        </button>
      </div>
      <div className="pw-nav__search">
        <SearchNormal1Icon className="pw-nav__search-icon" aria-hidden="true" />
        <input
          className="pw-nav__search-input"
          type="search"
          id="pw-search"
          name="pw-search"
          placeholder="Filter reference"
          aria-label="Filter reference"
          data-pw-search
        />
      </div>
      <div className="pw-nav__body" data-pw-nav-body>
        {customSectionsAt(config, "before-guide").map((section) => (
          <CustomSectionLink section={section} key={section.id} />
        ))}
        {hasGuide ? (
          <a className="pw-nav__item pw-nav__item--top" href="#integration-guide" data-pw-nav-item>
            <BookIcon className="pw-nav__section-icon" aria-hidden="true" />
            <span>Integration guide</span>
          </a>
        ) : null}
        {customSectionsAt(config, "after-guide").map((section) => (
          <CustomSectionLink section={section} key={section.id} />
        ))}
        {reference.groups.map((group) => (
          <NavSection
            key={group.name}
            name={group.name}
            count={group.operations.length}
            icon={<CategoryIcon />}
            searchText={`${group.name} ${group.operations.map(operationSearchText).join(" ")}`.toLowerCase()}
          >
            {group.operations.map((operation) => (
              <NavItem
                key={operation.anchor}
                href={`#${operation.anchor}`}
                title={operationDescription(operation)}
                searchText={operationSearchText(operation)}
              >
                <MethodBadge method={operation.method} />
                <span className="pw-nav__item-label">{operation.navTitle}</span>
              </NavItem>
            ))}
          </NavSection>
        ))}
        {schemas.length > 0 ? (
          <NavSection
            name="Schemas"
            count={schemas.length}
            icon={<CodeIcon />}
            searchText={`schemas ${schemas.map((schema) => schema.name).join(" ")}`.toLowerCase()}
          >
            {schemas.map((schema) => (
              <NavItem
                key={schema.anchor}
                href={`#${schema.anchor}`}
                searchText={schema.name.toLowerCase()}
              >
                <span className="pw-nav__item-label">{schema.name}</span>
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

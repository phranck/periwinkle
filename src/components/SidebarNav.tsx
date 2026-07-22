/**
 * Sidebar navigation for the generated reference.
 *
 * Sections use native `details`/`summary` so the rail works without
 * JavaScript; the client bundle enhances them with persisted open state,
 * search filtering, and the theme toggle via the `data-pw-*` hooks.
 * Endpoint paths stay out of the rail to keep it scannable — items show the
 * operation's navigation title with a method badge.
 */

import {
  BookOpenTextIcon,
  BracketsCurlyIcon,
  CaretDownIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
  TagIcon,
} from "@phosphor-icons/react";

import type { CustomSection } from "../config/config.js";
import type { ApiOperation, ApiReference } from "../model/api-reference.js";
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
        <CaretDownIcon className="pw-nav__chevron" aria-hidden="true" weight="bold" />
      </summary>
      <ul className="pw-nav__items">{children}</ul>
    </details>
  );
}

/**
 * The complete sidebar: brand row with theme toggle, search input, top-level
 * links (guide, custom sections), one collapsible section per endpoint
 * group, and the schemas section.
 *
 * @param props.reference The normalized API reference.
 * @param props.title Page title shown in the sidebar brand row.
 * @param props.logo Optional logo URL rendered next to the title.
 * @param props.hasGuide Whether the integration guide chapter exists.
 * @param props.customSections Custom sections that receive top-level links.
 */
export function SidebarNav({
  reference,
  title,
  logo,
  hasGuide,
  customSections,
}: {
  reference: ApiReference;
  title: string;
  logo?: string;
  hasGuide: boolean;
  customSections: CustomSection[];
}) {
  const schemas = Object.values(reference.schemas);
  return (
    <nav className="pw-nav" aria-label="API reference sections" data-pw-nav>
      <div className="pw-nav__brand">
        {logo ? <img className="pw-nav__logo" src={logo} alt="" /> : null}
        <span className="pw-nav__brand-title">{title}</span>
        <button
          type="button"
          className="pw-nav__theme-toggle"
          aria-label="Toggle color scheme"
          title="Toggle color scheme"
          data-pw-theme-toggle
        >
          <SunIcon
            className="pw-nav__theme-icon pw-nav__theme-icon--light"
            aria-hidden="true"
            weight="duotone"
          />
          <MoonIcon
            className="pw-nav__theme-icon pw-nav__theme-icon--dark"
            aria-hidden="true"
            weight="duotone"
          />
        </button>
      </div>
      <div className="pw-nav__search">
        <MagnifyingGlassIcon className="pw-nav__search-icon" aria-hidden="true" weight="duotone" />
        <input
          className="pw-nav__search-input"
          type="search"
          placeholder="Filter reference"
          aria-label="Filter reference"
          data-pw-search
        />
      </div>
      <div className="pw-nav__body" data-pw-nav-body>
        {hasGuide ? (
          <a className="pw-nav__item pw-nav__item--top" href="#integration-guide" data-pw-nav-item>
            <BookOpenTextIcon
              className="pw-nav__section-icon"
              aria-hidden="true"
              weight="duotone"
            />
            <span>Integration guide</span>
          </a>
        ) : null}
        {customSections.map((section) => (
          <a
            key={section.id}
            className="pw-nav__item pw-nav__item--top"
            href={`#${section.id}`}
            data-pw-nav-item
            data-pw-search-text={section.title.toLowerCase()}
          >
            <FileTextIcon className="pw-nav__section-icon" aria-hidden="true" weight="duotone" />
            <span>{section.title}</span>
          </a>
        ))}
        {reference.groups.map((group) => (
          <NavSection
            key={group.name}
            name={group.name}
            count={group.operations.length}
            icon={<TagIcon weight="duotone" />}
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
            icon={<BracketsCurlyIcon weight="duotone" />}
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
      </div>
    </nav>
  );
}

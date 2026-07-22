/**
 * Top-level documentation component.
 *
 * Renders the complete reference page body: intro header, sidebar
 * navigation, integration guide, custom sections, endpoint chapters, schema
 * chapter, and footer. The CLI wraps this component in a full HTML document;
 * host apps embed it directly and provide their own shell.
 */

import type { CustomSection } from "../config/config.js";
import { customSectionsAt, type DocsData } from "../render/prepare.js";
import { EndpointBlock } from "./EndpointBlock.jsx";
import { Book1Icon, BookIcon, CategoryIcon, CodeIcon } from "./icons.jsx";
import { Chapter, Markdown } from "./primitives.jsx";
import { SchemaCard } from "./SchemaCard.jsx";
import { SearchDialog } from "./SearchDialog.jsx";
import { SidebarNav } from "./SidebarNav.jsx";

function sectionsAt(data: DocsData, position: CustomSection["position"]): CustomSection[] {
  return customSectionsAt(data.config, position ?? "after-guide");
}

function CustomSectionChapter({ section }: { section: CustomSection }) {
  return (
    <Chapter id={section.id} title={section.title} icon={<Book1Icon />}>
      <div
        className="pw-panel"
        data-api-search-entry=""
        data-api-search-group={section.title}
        data-api-search-title={section.title}
        data-api-search-kind="chapter"
        data-api-search-target={section.id}
      >
        <Markdown content={section.markdown} />
      </div>
    </Chapter>
  );
}

function GuideChapter({ data }: { data: DocsData }) {
  return (
    <Chapter id="integration-guide" title="Integration guide" icon={<BookIcon />}>
      <div className="pw-guide">
        {data.guideSections.map((section) => (
          <div
            className="pw-panel"
            id={`guide-${section.id}`}
            key={section.id}
            data-api-search-entry=""
            data-api-search-group="Integration guide"
            data-api-search-title={section.title}
            data-api-search-addon="Guide"
            data-api-search-kind="chapter"
            data-api-search-target={`guide-${section.id}`}
          >
            <h3 className="pw-panel__title">{section.title}</h3>
            <Markdown content={section.markdown} />
          </div>
        ))}
      </div>
    </Chapter>
  );
}

/**
 * Renders the full documentation page body from prepared docs data.
 *
 * @param props.data Output of the build-time preparation step.
 */
export function ApiDocs({ data }: { data: DocsData }) {
  const { reference, config } = data;
  const schemas = Object.values(reference.schemas);
  const hasGuide = data.guideSections.length > 0;

  return (
    <div className="pw-shell">
      <div className="pw-layout">
        <SidebarNav data={data} />
        <main className="pw-content" data-api-search-root="">
          <header className="pw-intro">
            <h1 className="pw-intro__title">{data.title}</h1>
            <p className="pw-intro__lead">
              Generated from the OpenAPI contract for version {reference.version}.
            </p>
            {reference.description ? (
              <Markdown className="pw-intro__description" content={reference.description} />
            ) : null}
          </header>

          {sectionsAt(data, "before-guide").map((section) => (
            <CustomSectionChapter section={section} key={section.id} />
          ))}

          {hasGuide ? <GuideChapter data={data} /> : null}

          {sectionsAt(data, "after-guide").map((section) => (
            <CustomSectionChapter section={section} key={section.id} />
          ))}

          {reference.groups.map((group) => (
            <Chapter
              id={`group-${group.name.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`}
              title={group.name}
              icon={<CategoryIcon />}
              key={group.name}
            >
              {group.description ? <p className="pw-chapter__lead">{group.description}</p> : null}
              {group.operations.map((operation) => (
                <EndpointBlock
                  operation={operation}
                  data={data}
                  searchGroup={group.name}
                  key={operation.anchor}
                />
              ))}
            </Chapter>
          ))}

          {schemas.length > 0 ? (
            <Chapter id="schemas-heading" title="Schemas" icon={<CodeIcon />}>
              {schemas.map((schema) => (
                <SchemaCard schema={schema} data={data} key={schema.anchor} />
              ))}
            </Chapter>
          ) : null}

          {sectionsAt(data, "after-reference").map((section) => (
            <CustomSectionChapter section={section} key={section.id} />
          ))}

          {config.footer.links.length > 0 || config.footer.text ? (
            <footer className="pw-footer">
              {config.footer.links.length > 0 ? (
                <ul className="pw-footer__links">
                  {config.footer.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              ) : null}
              {config.footer.text ? <p className="pw-footer__text">{config.footer.text}</p> : null}
            </footer>
          ) : null}
        </main>
      </div>
      <SearchDialog />
    </div>
  );
}

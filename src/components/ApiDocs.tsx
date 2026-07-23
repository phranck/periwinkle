/**
 * Top-level documentation component.
 *
 * Renders the complete reference page body inside a single `surface-card`
 * shell (`.api-reference-shell` + `.api-reference-layout`), adopted from
 * the reference `ApiReferenceContent.astro`: an intro block, the sidebar
 * navigation, the Integration guide chapter (one large `ContentCard`
 * "Integration essentials" holding a grid of six `ContentPanel`s and a
 * `curl` example), custom sections, endpoint chapters, and the schema
 * chapter. The CLI wraps this component in a full HTML document; host apps
 * embed it directly.
 */

import type { CustomSection } from "../config/config.js";
import type { GuideSection } from "../render/guide.js";
import { customSectionsAt, type DocsData } from "../render/prepare.js";
import { ContentCard } from "./ContentCard.jsx";
import { ContentPanel } from "./ContentPanel.jsx";
import { EndpointBlock } from "./EndpointBlock.jsx";
import { ArrowCircleDownIcon, Book1Icon, BookIcon, CategoryIcon, CodeIcon } from "./icons.jsx";
import { OpenApiContractDialog, OpenApiContractDialogTrigger } from "./OpenApiContractDialog.jsx";
import { Chapter, CodeBlock, Markdown } from "./primitives.jsx";
import { SchemaCard } from "./SchemaCard.jsx";
import { SearchDialog } from "./SearchDialog.jsx";
import { SidebarNav } from "./SidebarNav.jsx";

/** Stable DOM ids the trigger/dialog pair use for aria wiring. */
const CONTRACT_DIALOG_ID = "openapi-contract-dialog";
const CONTRACT_DIALOG_TITLE_ID = "openapi-contract-dialog-title";
const CONTRACT_SOURCE_ELEMENT_ID = "openapi-contract-source";

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

function GuidePanel({ section }: { section: GuideSection }) {
  const targetId = `guide-${section.id}`;
  return (
    <ContentPanel
      id={targetId}
      tabIndex={-1}
      className="integration-panel"
      data-api-search-entry=""
      data-api-search-group="Integration guide"
      data-api-search-title={section.title}
      data-api-search-addon="Guide"
      data-api-search-kind="chapter"
      data-api-search-target={targetId}
    >
      <ContentPanel.Header>
        <ContentPanel.Header.Title>{section.title}</ContentPanel.Header.Title>
      </ContentPanel.Header>
      <ContentPanel.Content>
        <Markdown content={section.markdown} />
      </ContentPanel.Content>
    </ContentPanel>
  );
}

/** Panel that always accompanies the six guide sections; opens the dialog. */
function OpenApiContractPanel({ contractUrl }: { contractUrl: string | undefined }) {
  const targetId = "integration-openapi-contract";
  return (
    <ContentPanel
      id={targetId}
      tabIndex={-1}
      className="integration-panel"
      data-api-search-entry=""
      data-api-search-group="Integration guide"
      data-api-search-title="OpenAPI contract"
      data-api-search-addon="Guide"
      data-api-search-kind="chapter"
      data-api-search-target={targetId}
    >
      <ContentPanel.Header>
        <ContentPanel.Header.Title>OpenAPI contract</ContentPanel.Header.Title>
      </ContentPanel.Header>
      <ContentPanel.Content>
        <div className="integration-panel__stack">
          <p>
            {contractUrl ? (
              <>
                The public OpenAPI contract is available at{" "}
                <a
                  className="content-link"
                  href={contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {contractUrl}
                </a>
                .
              </>
            ) : (
              <>The public OpenAPI contract is bundled with this reference site.</>
            )}
          </p>
          <OpenApiContractDialogTrigger dialogId={CONTRACT_DIALOG_ID} />
        </div>
      </ContentPanel.Content>
    </ContentPanel>
  );
}

/**
 * Renders the Integration guide chapter as a single ContentCard whose body
 * carries the integration-panel grid plus the trailing bash example. The
 * OpenAPI-contract dialog lives at the tail of the same chapter body so
 * the trigger's aria-controls target is inside the visible document flow.
 */
function GuideChapter({
  data,
  contractSourceJson,
}: {
  data: DocsData;
  contractSourceJson: string;
}) {
  const curlBlock = data.codeBlocks["integration-essentials::curl"] ?? {
    html: "",
    code: "",
    language: "bash" as const,
  };
  return (
    <Chapter id="integration-guide" title="Integration guide" icon={<BookIcon />}>
      <ContentCard>
        <ContentCard.Header>
          <ContentCard.Header.Title>Integration essentials</ContentCard.Header.Title>
        </ContentCard.Header>
        <ContentCard.Body>
          <ContentCard.Body.Stack>
            <div className="integration-panel-grid">
              {data.guideSections.map((section) => (
                <GuidePanel key={section.id} section={section} />
              ))}
              <OpenApiContractPanel contractUrl={data.serverUrl} />
            </div>
            {curlBlock.html ? <CodeBlock block={curlBlock} label="Authenticated request" /> : null}
          </ContentCard.Body.Stack>
        </ContentCard.Body>
      </ContentCard>
      <OpenApiContractDialog
        id={CONTRACT_DIALOG_ID}
        titleId={CONTRACT_DIALOG_TITLE_ID}
        sourceElementId={CONTRACT_SOURCE_ELEMENT_ID}
        title={`Public OpenAPI contract, v${data.reference.version}`}
      >
        <CodeBlock
          block={{
            html: "",
            code: "",
            language: "json",
          }}
          fillAvailable
        />
      </OpenApiContractDialog>
      <script
        type="application/json"
        id={CONTRACT_SOURCE_ELEMENT_ID}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON.stringify output of the build-time Shiki payload; the surrounding CDATA is escaped at build time.
        dangerouslySetInnerHTML={{ __html: contractSourceJson }}
      />
    </Chapter>
  );
}

/**
 * Renders the full documentation page body from prepared docs data.
 *
 * @param props.data Output of the build-time preparation step.
 * @param props.contractSourceJson JSON-encoded, Shiki-highlighted contract
 *   payload embedded as a `<script type="application/json">` so the client
 *   binder can hand it to the CodeBlock frame the first time the dialog
 *   opens. The CLI writes this at build time; consumers embedding
 *   `ApiDocs` directly may omit it, which disables the dialog trigger's
 *   preview but keeps the surrounding markup identical.
 */
export function ApiDocs({
  data,
  contractSourceJson = '""',
}: {
  data: DocsData;
  contractSourceJson?: string;
}) {
  const { reference, config } = data;
  const schemas = Object.values(reference.schemas);
  const hasGuide = data.guideSections.length > 0;

  return (
    <div className="pw-shell">
      <div className="api-reference-shell">
        <div className="card-content-inset mb-8 pw-intro" data-api-reference-intro="">
          <h1 className="pw-intro__title">{data.title}</h1>
          <p className="pw-intro__lead">
            Generated from the OpenAPI contract for version {reference.version}.
          </p>
          {reference.description ? (
            <Markdown className="pw-intro__description" content={reference.description} />
          ) : null}
        </div>

        <div className="api-reference-layout pw-layout">
          <SidebarNav data={data} />
          <main className="pw-content" data-api-search-root="">
            {sectionsAt(data, "before-guide").map((section) => (
              <CustomSectionChapter section={section} key={section.id} />
            ))}

            {hasGuide ? <GuideChapter data={data} contractSourceJson={contractSourceJson} /> : null}

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
              <Chapter
                id="schemas-heading"
                title="Schemas"
                icon={<CodeIcon />}
                addon={
                  <button
                    type="button"
                    className="api-content__chapter-toggle pw-chevron"
                    aria-label="Expand all schema cards"
                    title="Expand all schema cards"
                    data-pw-schema-cards-toggle
                  >
                    <ArrowCircleDownIcon aria-hidden="true" />
                  </button>
                }
              >
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
                {config.footer.text ? (
                  <p className="pw-footer__text">{config.footer.text}</p>
                ) : null}
              </footer>
            ) : null}
          </main>
        </div>
      </div>
      <SearchDialog />
    </div>
  );
}

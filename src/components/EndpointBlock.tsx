/**
 * One endpoint block: header card with method, path and access badge,
 * followed by description, parameters, request body, responses, and the
 * generated curl example.
 */

import type { ApiMediaType, ApiOperation } from "../model/api-reference.js";
import { schemaAnchor } from "../model/api-reference.js";
import { codeKey, type DocsData } from "../render/prepare.js";
import { CodeIcon, KeyIcon, Send2Icon, TickCircleIcon, Warning2Icon } from "./icons.jsx";
import { CodeBlock, Entry, InlineMarkdown, Markdown } from "./primitives.jsx";

function responseTone(status: string): string {
  if (status.startsWith("2")) return "success";
  if (status.startsWith("3")) return "redirect";
  if (status.startsWith("4")) return "client-error";
  if (status.startsWith("5")) return "server-error";
  return "neutral";
}

/** Accessible card label per status class (reference `responseLabel`). */
function responseLabel(status: string): string {
  if (status.startsWith("2")) return "Success response";
  if (status.startsWith("3")) return "Redirect response";
  if (status.startsWith("4")) return "Client error response";
  if (status.startsWith("5")) return "Server error response";
  return "Response";
}

function mediaSchemaRefs(media: ApiMediaType): string[] {
  return media.schemaRefs ?? (media.schemaRef ? [media.schemaRef] : []);
}

function SectionHeader({ icon, id, title }: { icon: React.ReactNode; id: string; title: string }) {
  return (
    <h4 className="pw-endpoint__section-header" id={id}>
      <span className="pw-endpoint__section-icon" aria-hidden="true">
        {icon}
      </span>
      {title}
    </h4>
  );
}

/**
 * Renders one operation as a full endpoint entry.
 *
 * @param props.operation The normalized operation.
 * @param props.data The prepared docs data (code lookups, security schemes).
 * @param props.searchGroup Visible group name the operation is indexed under
 *   in the document search (mirrors the reference's `searchGroup` prop).
 */
export function EndpointBlock({
  operation,
  data,
  searchGroup,
}: {
  operation: ApiOperation;
  data: DocsData;
  searchGroup: string;
}) {
  const anchor = operation.anchor;
  const requiresAuth = operation.security.length > 0;
  const curlBlock = data.codeBlocks[codeKey(anchor, "curl")];
  const { features } = data.config;

  return (
    <Entry title={operation.navTitle}>
      <article
        className="pw-endpoint"
        id={anchor}
        aria-label={`${operation.method} ${operation.path}`}
        data-api-search-entry=""
        data-api-search-group={searchGroup}
        data-api-search-title={operation.navTitle}
        data-api-search-addon={`${operation.method} ${operation.path}`}
        data-api-search-kind="operation"
        data-api-search-target={anchor}
      >
        <header
          className={`pw-endpoint__header pw-endpoint__header--${operation.method.toLowerCase()}`}
          data-api-search-ignore=""
        >
          <span className="pw-endpoint__request">
            <span className="pw-endpoint__method">{operation.method}</span>
            <code className="pw-endpoint__path">{operation.path}</code>
            {operation.deprecated && features.deprecatedBadge ? (
              <span className="pw-endpoint__deprecated">Deprecated</span>
            ) : null}
          </span>
          {features.accessBadge ? (
            <span className="pw-endpoint__access">
              {requiresAuth ? (
                <>
                  <KeyIcon aria-hidden="true" /> Authentication required
                </>
              ) : (
                "Public endpoint"
              )}
            </span>
          ) : null}
        </header>
        <div className="pw-endpoint__body">
          {operation.summary ? <p className="pw-endpoint__summary">{operation.summary}</p> : null}
          {operation.description ? (
            <Markdown className="pw-endpoint__description" content={operation.description} />
          ) : null}

          {operation.parameters.length > 0 ? (
            <section className="pw-endpoint__section" aria-labelledby={`${anchor}-parameters`}>
              <SectionHeader icon={<CodeIcon />} id={`${anchor}-parameters`} title="Parameters" />
              <dl className="content-panel-list">
                {operation.parameters.map((parameter) => (
                  <div
                    className="content-panel parameter-card"
                    key={`${parameter.location}-${parameter.name}`}
                  >
                    <dt className="content-panel__header parameter-card__header">
                      <code className="parameter-card__name">{parameter.name}</code>
                      <span className="parameter-card__location">{parameter.location}</span>
                      {parameter.required ? (
                        <span className="parameter-card__requirement">Required</span>
                      ) : null}
                    </dt>
                    {parameter.description ? (
                      <dd className="content-panel__content parameter-card__body">
                        <InlineMarkdown content={parameter.description} />
                      </dd>
                    ) : null}
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {operation.requestBody && operation.requestBody.mediaTypes.length > 0 ? (
            <section className="pw-endpoint__section" aria-labelledby={`${anchor}-request-body`}>
              <SectionHeader
                icon={<Send2Icon />}
                id={`${anchor}-request-body`}
                title="Request body"
              />
              {operation.requestBody.description ? (
                <Markdown content={operation.requestBody.description} />
              ) : null}
              <div className="content-panel-list">
                {operation.requestBody.mediaTypes.map((media) => {
                  const exampleBlock = data.codeBlocks[codeKey(anchor, "request", media.mediaType)];
                  return (
                    <div className="content-panel request-body-card" key={media.mediaType}>
                      <div className="content-panel__header request-body-card__header">
                        <code className="request-body-card__media-type">{media.mediaType}</code>
                        {mediaSchemaRefs(media).map((ref) => (
                          <a
                            className="content-link request-body-card__schema-link"
                            href={`#${schemaAnchor(ref)}`}
                            key={ref}
                          >
                            {ref}
                          </a>
                        ))}
                      </div>
                      {exampleBlock ? (
                        <div className="content-panel__content request-body-card__body">
                          <CodeBlock
                            block={exampleBlock}
                            label="Example"
                            showCopyButton={features.copyButton}
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="pw-endpoint__section" aria-labelledby={`${anchor}-responses`}>
            <SectionHeader icon={<TickCircleIcon />} id={`${anchor}-responses`} title="Responses" />
            <div className="content-panel-list">
              {operation.responses.map((response) => {
                const tone = responseTone(response.status);
                const StatusIcon = tone === "success" ? TickCircleIcon : Warning2Icon;
                return (
                  <article
                    className={`content-panel response-card response-card--${tone}`}
                    aria-label={responseLabel(response.status)}
                    key={response.status}
                  >
                    <span className="response-card__status">
                      <StatusIcon className="response-card__icon" aria-hidden="true" />
                      <code className="response-card__code">{response.status}</code>
                    </span>
                    <div className="response-card__content">
                      {response.description ? (
                        <div className="response-card__summary">
                          <InlineMarkdown content={response.description} />
                        </div>
                      ) : null}
                      {response.mediaTypes.length > 0 ? (
                        <div className="response-card__meta">
                          {response.mediaTypes.map((media) => (
                            <div className="response-card__meta-row" key={media.mediaType}>
                              <span className="response-card__meta-item">
                                <span className="response-card__meta-label">Content-Type:</span>
                                <code className="response-card__media-type">{media.mediaType}</code>
                              </span>
                              {mediaSchemaRefs(media).map((ref) => (
                                <span className="response-card__meta-item" key={ref}>
                                  <span className="response-card__meta-label">
                                    Response Object:
                                  </span>
                                  <a
                                    className="content-link response-card__schema-link"
                                    href={`#${schemaAnchor(ref)}`}
                                  >
                                    <code className="response-card__schema-name">{ref}</code>
                                  </a>
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {curlBlock ? (
            <section className="pw-endpoint__section" aria-labelledby={`${anchor}-example`}>
              <SectionHeader icon={<CodeIcon />} id={`${anchor}-example`} title="Example request" />
              <CodeBlock block={curlBlock} showCopyButton={features.copyButton} />
            </section>
          ) : null}
        </div>
      </article>
    </Entry>
  );
}

/**
 * One endpoint block: header card with method, path and access badge,
 * followed by description, parameters, request body, responses, and the
 * generated curl example.
 */

import type { ApiMediaType, ApiOperation } from "../model/api-reference.js";
import { schemaAnchor } from "../model/api-reference.js";
import { codeKey, type DocsData } from "../render/prepare.js";
import { CodeIcon, KeyIcon, Send2Icon, TickCircleIcon, Warning2Icon } from "./icons.jsx";
import { CodeBlock, Entry, InlineMarkdown, Markdown, MethodBadge } from "./primitives.jsx";

function responseTone(status: string): string {
  if (status.startsWith("2")) return "success";
  if (status.startsWith("4")) return "client-error";
  if (status.startsWith("5")) return "server-error";
  return "neutral";
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
            <MethodBadge method={operation.method} />
            <code className="pw-endpoint__path">{operation.path}</code>
            {operation.deprecated ? (
              <span className="pw-endpoint__deprecated">Deprecated</span>
            ) : null}
          </span>
          <span className="pw-endpoint__access">
            {requiresAuth ? (
              <>
                <KeyIcon aria-hidden="true" /> Authentication required
              </>
            ) : (
              "Public endpoint"
            )}
          </span>
        </header>
        <div className="pw-endpoint__body">
          {operation.summary ? <p className="pw-endpoint__summary">{operation.summary}</p> : null}
          {operation.description ? (
            <Markdown className="pw-endpoint__description" content={operation.description} />
          ) : null}

          {operation.parameters.length > 0 ? (
            <section className="pw-endpoint__section" aria-labelledby={`${anchor}-parameters`}>
              <SectionHeader icon={<CodeIcon />} id={`${anchor}-parameters`} title="Parameters" />
              <ul className="pw-params">
                {operation.parameters.map((parameter) => (
                  <li className="pw-param" key={`${parameter.location}-${parameter.name}`}>
                    <span className="pw-param__header">
                      <code className="pw-param__name">{parameter.name}</code>
                      <span className="pw-param__location">{parameter.location}</span>
                      <code className="pw-param__type">{parameter.typeLabel}</code>
                      {parameter.required ? (
                        <span className="pw-param__required">Required</span>
                      ) : null}
                    </span>
                    {parameter.description ? (
                      <span className="pw-param__description">
                        <InlineMarkdown content={parameter.description} />
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
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
              {operation.requestBody.mediaTypes.map((media) => {
                const exampleBlock = data.codeBlocks[codeKey(anchor, "request", media.mediaType)];
                return (
                  <div className="pw-media" key={media.mediaType}>
                    <span className="pw-media__header">
                      <code className="pw-media__type">{media.mediaType}</code>
                      {mediaSchemaRefs(media).map((ref) => (
                        <a className="pw-schema-link" href={`#${schemaAnchor(ref)}`} key={ref}>
                          {ref}
                        </a>
                      ))}
                    </span>
                    {exampleBlock ? <CodeBlock block={exampleBlock} label="Example" /> : null}
                  </div>
                );
              })}
            </section>
          ) : null}

          <section className="pw-endpoint__section" aria-labelledby={`${anchor}-responses`}>
            <SectionHeader icon={<TickCircleIcon />} id={`${anchor}-responses`} title="Responses" />
            <ul className="pw-responses">
              {operation.responses.map((response) => {
                const tone = responseTone(response.status);
                const StatusIcon = tone === "success" ? TickCircleIcon : Warning2Icon;
                return (
                  <li className={`pw-response pw-response--${tone}`} key={response.status}>
                    <span className="pw-response__status">
                      <StatusIcon className="pw-response__icon" aria-hidden="true" />
                      <code className="pw-response__code">{response.status}</code>
                    </span>
                    <div className="pw-response__content">
                      {response.description ? (
                        <InlineMarkdown content={response.description} />
                      ) : null}
                      {response.mediaTypes.map((media) => {
                        const exampleBlock =
                          data.codeBlocks[
                            codeKey(anchor, "response", response.status, media.mediaType)
                          ];
                        return (
                          <div className="pw-response__meta" key={media.mediaType}>
                            <span className="pw-media__header">
                              <code className="pw-media__type">{media.mediaType}</code>
                              {mediaSchemaRefs(media).map((ref) => (
                                <a
                                  className="pw-schema-link"
                                  href={`#${schemaAnchor(ref)}`}
                                  key={ref}
                                >
                                  {ref}
                                </a>
                              ))}
                            </span>
                            {exampleBlock ? (
                              <CodeBlock block={exampleBlock} label="Example" />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {curlBlock ? (
            <section className="pw-endpoint__section" aria-labelledby={`${anchor}-example`}>
              <SectionHeader icon={<CodeIcon />} id={`${anchor}-example`} title="Example request" />
              <CodeBlock block={curlBlock} />
            </section>
          ) : null}
        </div>
      </article>
    </Entry>
  );
}

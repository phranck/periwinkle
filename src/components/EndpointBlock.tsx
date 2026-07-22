/**
 * One endpoint block: header card with method, path and access badge,
 * followed by description, parameters, request body, responses, and the
 * generated curl example.
 */

import { CheckCircleIcon, CodeIcon, KeyIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";

import type { ApiMediaType, ApiOperation } from "../model/api-reference.js";
import { schemaAnchor } from "../model/api-reference.js";
import { codeKey, type DocsData } from "../render/prepare.js";
import { CodeBlock, Entry, InlineMarkdown, Markdown, MethodBadge } from "./primitives.jsx";

function responseTone(status: string): string {
  if (status.startsWith("2")) return "success";
  if (status.startsWith("4") || status.startsWith("5")) return "error";
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
 */
export function EndpointBlock({ operation, data }: { operation: ApiOperation; data: DocsData }) {
  const anchor = operation.anchor;
  const requiresAuth = operation.security.length > 0;
  const curlHtml = data.codeHtml[codeKey(anchor, "curl")];

  return (
    <Entry title={operation.navTitle}>
      <article
        className="pw-endpoint"
        id={anchor}
        aria-label={`${operation.method} ${operation.path}`}
      >
        <header
          className={`pw-endpoint__header pw-endpoint__header--${operation.method.toLowerCase()}`}
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
                <KeyIcon aria-hidden="true" weight="duotone" /> Authentication required
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
              <SectionHeader
                icon={<CodeIcon weight="duotone" />}
                id={`${anchor}-parameters`}
                title="Parameters"
              />
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
                icon={<PaperPlaneTiltIcon weight="duotone" />}
                id={`${anchor}-request-body`}
                title="Request body"
              />
              {operation.requestBody.description ? (
                <Markdown content={operation.requestBody.description} />
              ) : null}
              {operation.requestBody.mediaTypes.map((media) => {
                const exampleHtml = data.codeHtml[codeKey(anchor, "request", media.mediaType)];
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
                    {exampleHtml ? <CodeBlock html={exampleHtml} label="Example" /> : null}
                  </div>
                );
              })}
            </section>
          ) : null}

          <section className="pw-endpoint__section" aria-labelledby={`${anchor}-responses`}>
            <SectionHeader
              icon={<CheckCircleIcon weight="duotone" />}
              id={`${anchor}-responses`}
              title="Responses"
            />
            <ul className="pw-responses">
              {operation.responses.map((response) => (
                <li
                  className={`pw-response pw-response--${responseTone(response.status)}`}
                  key={response.status}
                >
                  <span className="pw-response__status">{response.status}</span>
                  <div className="pw-response__content">
                    {response.description ? (
                      <InlineMarkdown content={response.description} />
                    ) : null}
                    {response.mediaTypes.map((media) => {
                      const exampleHtml =
                        data.codeHtml[
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
                          {exampleHtml ? <CodeBlock html={exampleHtml} label="Example" /> : null}
                        </div>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {curlHtml ? (
            <section className="pw-endpoint__section" aria-labelledby={`${anchor}-example`}>
              <SectionHeader
                icon={<CodeIcon weight="duotone" />}
                id={`${anchor}-example`}
                title="Example request"
              />
              <CodeBlock html={curlHtml} />
            </section>
          ) : null}
        </div>
      </article>
    </Entry>
  );
}

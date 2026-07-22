/**
 * One collapsible schema card with two views: the flattened key
 * documentation table and the raw JSON schema.
 *
 * The card uses native `details`/`summary` for collapsing (usable without
 * JavaScript); the fields/JSON tab switch binds through `data-pw-*` hooks in
 * the client bundle. The fields view is the no-JS default.
 */

import type { ApiSchema } from "../model/api-reference.js";
import { schemaAnchor } from "../model/api-reference.js";
import { codeKey, type DocsData } from "../render/prepare.js";
import { ArrowCircleDownIcon } from "./icons.jsx";
import { CodeBlock, InlineMarkdown, Markdown } from "./primitives.jsx";

/**
 * Pairs each field row with a render key that stays unique even when the
 * same field name appears repeatedly (e.g. through nested references).
 */
function withFieldKeys(fields: ApiSchema["fields"]): Array<[string, ApiSchema["fields"][number]]> {
  const seen = new Map<string, number>();
  return fields.map((field) => {
    const base = `${field.depth}:${field.path}`;
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);
    return [occurrence === 0 ? base : `${base}:${occurrence}`, field];
  });
}

/**
 * Renders one component schema as a collapsible card.
 *
 * @param props.schema The normalized schema.
 * @param props.data The prepared docs data (highlighted JSON lookup).
 */
export function SchemaCard({ schema, data }: { schema: ApiSchema; data: DocsData }) {
  const jsonHtml = data.codeHtml[codeKey(schema.anchor, "json")];
  const headingId = `${schema.anchor}-heading`;

  return (
    <details
      className="pw-schema-card"
      id={schema.anchor}
      data-pw-schema-card={schema.anchor}
      data-api-search-entry=""
      data-api-search-group="Schemas"
      data-api-search-title={schema.name}
      data-api-search-addon="Schema"
      data-api-search-kind="schema"
      data-api-search-target={schema.anchor}
    >
      <summary className="pw-schema-card__summary">
        <span className="pw-schema-card__title" id={headingId}>
          {schema.name}
        </span>
        <span className="pw-schema-card__tabs">
          <button
            type="button"
            className="pw-schema-card__tab"
            data-pw-tab="fields"
            aria-pressed="true"
          >
            Fields
          </button>
          <button
            type="button"
            className="pw-schema-card__tab"
            data-pw-tab="json"
            aria-pressed="false"
          >
            JSON schema
          </button>
        </span>
        <ArrowCircleDownIcon className="pw-schema-card__chevron" aria-hidden="true" />
      </summary>
      <div className="pw-schema-card__body">
        {schema.description ? <Markdown content={schema.description} /> : null}
        <div className="pw-schema-card__panel" data-pw-panel="fields">
          {schema.fields.length > 0 ? (
            <table className="pw-fields">
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">Key Presence</th>
                  <th scope="col">Value Type</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                {withFieldKeys(schema.fields).map(([key, field]) => (
                  <tr className="pw-fields__row" data-depth={field.depth} key={key}>
                    <td className="pw-fields__name">
                      {field.schemaRef ? (
                        <a className="pw-schema-link" href={`#${schemaAnchor(field.schemaRef)}`}>
                          {field.path}
                        </a>
                      ) : (
                        <code>{field.path}</code>
                      )}
                    </td>
                    <td className="pw-fields__presence">
                      <span data-presence={field.required ? "included" : "optional"}>
                        {field.required ? "included" : "optional"}
                      </span>
                    </td>
                    <td className="pw-fields__type">
                      <code>{field.type}</code>
                    </td>
                    <td className="pw-fields__description">
                      {field.description ? <InlineMarkdown content={field.description} /> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {schema.variants.length > 0 ? (
            <div className="pw-schema-card__variants">
              <span className="pw-schema-card__variants-title">Variants</span>
              <ul className="pw-schema-card__variants-list">
                {schema.variants.map((variant) => (
                  <li key={variant.name}>
                    <a className="pw-schema-link" href={`#${variant.anchor}`}>
                      {variant.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="pw-schema-card__panel" data-pw-panel="json" hidden>
          {jsonHtml ? <CodeBlock html={jsonHtml} /> : null}
        </div>
      </div>
    </details>
  );
}

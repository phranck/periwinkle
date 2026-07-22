/**
 * Build-time data preparation for the periwinkle UI.
 *
 * `prepareDocsData()` performs every async step (Shiki highlighting) up
 * front, so the React components can render synchronously via
 * `renderToStaticMarkup` in the CLI and inside host apps alike.
 */

import type { ResolvedConfig } from "../config/config.js";
import { type ApiReference, buildApiReference } from "../model/api-reference.js";
import { buildCurlExample } from "./curl.js";
import { type GuideSection, resolveGuideSections } from "./guide.js";
import { type HighlightLanguage, highlightCode } from "./highlight.js";

/**
 * Everything the UI components need to render one documentation page.
 *
 * @property reference The normalized API reference.
 * @property config The resolved periwinkle configuration.
 * @property title Effective page title (config override or spec title).
 * @property serverUrl Effective server base URL, when known.
 * @property guideSections Resolved integration guide sections in order.
 * @property codeHtml Pre-highlighted code blocks keyed by {@link codeKey}.
 */
export interface DocsData {
  reference: ApiReference;
  config: ResolvedConfig;
  title: string;
  serverUrl?: string;
  guideSections: GuideSection[];
  codeHtml: Record<string, string>;
}

/**
 * Builds the lookup key for a pre-highlighted code block.
 *
 * @param parts Stable key segments, e.g. an operation anchor and a suffix.
 * @returns The joined key used in {@link DocsData.codeHtml}.
 */
export function codeKey(...parts: string[]): string {
  return parts.join("::");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstServerUrl(document: unknown): string | undefined {
  if (!isRecord(document) || !Array.isArray(document.servers)) return undefined;
  const server = document.servers[0];
  return isRecord(server) && typeof server.url === "string" ? server.url : undefined;
}

/**
 * Normalizes the OpenAPI document and pre-renders every code block.
 *
 * @param document The parsed OpenAPI 3.x document.
 * @param config The resolved periwinkle configuration.
 * @returns The complete {@link DocsData} for synchronous rendering.
 * @throws Error when the document fails {@link buildApiReference} validation.
 */
export async function prepareDocsData(
  document: unknown,
  config: ResolvedConfig,
): Promise<DocsData> {
  const reference = buildApiReference(document);
  const serverUrl = config.site.serverUrl ?? firstServerUrl(document);
  const guideSections = resolveGuideSections(reference, config.guide, serverUrl);

  const pending: Array<{ key: string; code: string; language: HighlightLanguage }> = [];

  for (const group of reference.groups) {
    for (const operation of group.operations) {
      pending.push({
        key: codeKey(operation.anchor, "curl"),
        code: buildCurlExample(operation, serverUrl, reference.securitySchemes),
        language: "bash",
      });
      for (const media of operation.requestBody?.mediaTypes ?? []) {
        if (media.example !== undefined) {
          pending.push({
            key: codeKey(operation.anchor, "request", media.mediaType),
            code: JSON.stringify(media.example, null, 2),
            language: "json",
          });
        }
      }
      for (const response of operation.responses) {
        for (const media of response.mediaTypes) {
          if (media.example !== undefined) {
            pending.push({
              key: codeKey(operation.anchor, "response", response.status, media.mediaType),
              code: JSON.stringify(media.example, null, 2),
              language: "json",
            });
          }
        }
      }
    }
  }

  for (const schema of Object.values(reference.schemas)) {
    pending.push({
      key: codeKey(schema.anchor, "json"),
      code: JSON.stringify(schema.schema, null, 2),
      language: "json",
    });
  }

  const codeHtml: Record<string, string> = {};
  await Promise.all(
    pending.map(async (entry) => {
      codeHtml[entry.key] = await highlightCode(entry.code, entry.language);
    }),
  );

  return {
    reference,
    config,
    title: config.site.title ?? reference.title,
    ...(serverUrl !== undefined ? { serverUrl } : {}),
    guideSections,
    codeHtml,
  };
}

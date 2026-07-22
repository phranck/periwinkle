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
 * One pre-rendered code block.
 *
 * Alongside the highlighted markup the UI needs the raw source: the line
 * count drives the reference's gutter/scroll switches and the content hash
 * forms the stable block id the copy control targets.
 *
 * @property html Highlighted `<pre class="shiki">` markup from Shiki.
 * @property code Raw source text of the snippet, exactly what a copy action
 *   must yield.
 * @property language Highlight language of the snippet.
 */
export interface PreparedCodeBlock {
  html: string;
  code: string;
  language: HighlightLanguage;
}

/**
 * Everything the UI components need to render one documentation page.
 *
 * @property reference The normalized API reference.
 * @property config The resolved periwinkle configuration.
 * @property title Effective page title (config override or spec title).
 * @property serverUrl Effective server base URL, when known.
 * @property guideSections Resolved integration guide sections in order.
 * @property codeBlocks Pre-rendered code blocks keyed by {@link codeKey}.
 */
export interface DocsData {
  reference: ApiReference;
  config: ResolvedConfig;
  title: string;
  serverUrl?: string;
  guideSections: GuideSection[];
  codeBlocks: Record<string, PreparedCodeBlock>;
}

/**
 * Builds the lookup key for a pre-highlighted code block.
 *
 * @param parts Stable key segments, e.g. an operation anchor and a suffix.
 * @returns The joined key used in {@link DocsData.codeBlocks}.
 */
export function codeKey(...parts: string[]): string {
  return parts.join("::");
}

/**
 * Returns the custom sections placed at one position, preserving authored
 * order. Sections without an explicit position default to `after-guide`.
 * Sidebar and content both derive their ordering from this helper so the
 * two can never disagree.
 *
 * @param config The resolved configuration.
 * @param position The placement to filter for.
 */
export function customSectionsAt(
  config: ResolvedConfig,
  position: NonNullable<ResolvedConfig["customSections"][number]["position"]>,
): ResolvedConfig["customSections"] {
  return config.customSections.filter(
    (section) => (section.position ?? "after-guide") === position,
  );
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
      // Response media examples are intentionally not pre-highlighted: the
      // reference response card renders no code block, only the media/schema
      // header row. Skipping the pending entries avoids Shiki work for markup
      // that never lands in the DOM.
    }
  }

  for (const schema of Object.values(reference.schemas)) {
    pending.push({
      key: codeKey(schema.anchor, "json"),
      code: JSON.stringify(schema.schema, null, 2),
      language: "json",
    });
  }

  const codeBlocks: Record<string, PreparedCodeBlock> = {};
  await Promise.all(
    pending.map(async (entry) => {
      codeBlocks[entry.key] = {
        html: await highlightCode(entry.code, entry.language),
        code: entry.code,
        language: entry.language,
      };
    }),
  );

  return {
    reference,
    config,
    title: config.site.title ?? reference.title,
    ...(serverUrl !== undefined ? { serverUrl } : {}),
    guideSections,
    codeBlocks,
  };
}

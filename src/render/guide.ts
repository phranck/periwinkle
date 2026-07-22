/**
 * Integration guide resolution.
 *
 * Merges authored guide content from the config with generic fallback copy
 * derived from the OpenAPI document. Sections switched off with `false`
 * disappear; sections without authored content use derived defaults when a
 * sensible one exists, otherwise they are omitted.
 */

import type { GuideConfig, ResolvedConfig } from "../config/config.js";
import type { ApiReference, ApiSecurityScheme } from "../model/api-reference.js";

/**
 * One resolved integration guide section ready for rendering.
 *
 * @property id Stable section id, used as in-page anchor (`guide-<id>`).
 * @property title Section heading.
 * @property markdown Section body as Markdown.
 */
export interface GuideSection {
  id: string;
  title: string;
  markdown: string;
}

function describeScheme(scheme: ApiSecurityScheme): string {
  if (scheme.type === "apiKey" && scheme.parameterName) {
    const location = scheme.location ?? "header";
    return `Send the \`${scheme.parameterName}\` ${location} with every request (scheme \`${scheme.name}\`).`;
  }
  if (scheme.type === "http" && scheme.httpScheme === "bearer") {
    return `Send an \`Authorization: Bearer <token>\` header with every request (scheme \`${scheme.name}\`).`;
  }
  if (scheme.type === "http" && scheme.httpScheme === "basic") {
    return `Use HTTP Basic authentication (scheme \`${scheme.name}\`).`;
  }
  return `Authentication uses the \`${scheme.name}\` scheme (\`${scheme.type}\`).`;
}

function defaultAuth(reference: ApiReference): string | undefined {
  if (reference.securitySchemes.length === 0) return undefined;
  const lines = reference.securitySchemes.map((scheme) => {
    const description = scheme.description ? ` ${scheme.description}` : "";
    return `- ${describeScheme(scheme)}${description}`;
  });
  return `Never expose credentials in browser code.\n\n${lines.join("\n")}`;
}

function defaultRequests(serverUrl: string | undefined): string | undefined {
  if (!serverUrl) return undefined;
  return `Use JSON request bodies and read JSON responses from \`${serverUrl}\`.`;
}

const DEFAULT_ERRORS =
  "Errors use standard HTTP status codes. Each operation below documents its error responses.";

function defaultVersioning(reference: ApiReference): string {
  return `This reference is generated from API version ${reference.version}.`;
}

/**
 * Resolves the effective guide sections for one build.
 *
 * @param reference The normalized API reference (source of derived defaults).
 * @param guide The guide part of the resolved config.
 * @param serverUrl Effective server base URL, when known.
 * @returns Sections in display order; switched-off and empty sections are
 *   excluded.
 */
export function resolveGuideSections(
  reference: ApiReference,
  guide: ResolvedConfig["guide"],
  serverUrl: string | undefined,
): GuideSection[] {
  const candidates: Array<{ id: keyof GuideConfig; title: string; fallback: string | undefined }> =
    [
      { id: "auth", title: "Authentication", fallback: defaultAuth(reference) },
      { id: "requests", title: "Requests", fallback: defaultRequests(serverUrl) },
      { id: "errors", title: "Errors", fallback: DEFAULT_ERRORS },
      { id: "rateLimits", title: "Rate limits", fallback: undefined },
      { id: "versioning", title: "Versioning", fallback: defaultVersioning(reference) },
    ];

  const sections: GuideSection[] = [];
  for (const candidate of candidates) {
    const authored = guide[candidate.id];
    if (authored === false) continue;
    const markdown = authored ?? candidate.fallback;
    if (!markdown) continue;
    sections.push({ id: candidate.id, title: candidate.title, markdown });
  }
  return sections;
}

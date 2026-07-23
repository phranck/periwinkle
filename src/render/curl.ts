/**
 * curl example generation for endpoint blocks.
 *
 * Examples are illustrative one-liners derived from the normalized operation:
 * they show the full URL, the auth header for the operation's first security
 * scheme (with a shell variable placeholder, never a literal secret), and a
 * JSON body when the operation accepts one.
 */

import type { ApiOperation, ApiSecurityScheme } from "../model/api-reference.js";

/** Placeholder shell variable used for API keys in generated examples. */
const API_KEY_VARIABLE = "$API_KEY";
/** Placeholder shell variable used for bearer tokens in generated examples. */
const ACCESS_TOKEN_VARIABLE = "$ACCESS_TOKEN";

function authArguments(scheme: ApiSecurityScheme | undefined): string[] {
  if (!scheme) return [];
  if (scheme.type === "apiKey" && scheme.parameterName) {
    if (scheme.location === "query") return [];
    return [`-H "${scheme.parameterName}: ${API_KEY_VARIABLE}"`];
  }
  if (scheme.type === "http" && scheme.httpScheme === "bearer") {
    return [`-H "Authorization: Bearer ${ACCESS_TOKEN_VARIABLE}"`];
  }
  if (scheme.type === "http" && scheme.httpScheme === "basic") {
    return ['-u "$USERNAME:$PASSWORD"'];
  }
  return [];
}

function queryAuthSuffix(scheme: ApiSecurityScheme | undefined): string {
  if (scheme?.type === "apiKey" && scheme.location === "query" && scheme.parameterName) {
    return `?${scheme.parameterName}=${API_KEY_VARIABLE}`;
  }
  return "";
}

function requestBodyArguments(operation: ApiOperation): string[] {
  const media = operation.requestBody?.mediaTypes.find((entry) => entry.mediaType.includes("json"));
  if (!media) return [];
  const payload = media.example !== undefined ? JSON.stringify(media.example) : "{}";
  return ['-H "Content-Type: application/json"', `-d '${payload}'`];
}

/**
 * Builds a multi-line curl example for one operation.
 *
 * @param operation The normalized operation.
 * @param serverUrl Base URL prefixed to the operation path. Falls back to a
 *   `https://api.example.com` placeholder when the document declares none.
 * @param securitySchemes All declared security schemes, used to resolve the
 *   operation's first requirement into concrete auth arguments.
 * @returns A shell snippet with one argument per line.
 */
export function buildCurlExample(
  operation: ApiOperation,
  serverUrl: string | undefined,
  securitySchemes: ApiSecurityScheme[],
): string {
  const base = (serverUrl ?? "https://api.example.com").replace(/\/+$/, "");
  const scheme = securitySchemes.find((candidate) => candidate.name === operation.security[0]);
  const url = `${base}${operation.path}${queryAuthSuffix(scheme)}`;

  const parts = [
    `curl${operation.method === "GET" ? "" : ` -X ${operation.method}`} "${url}"`,
    ...authArguments(scheme),
    ...requestBodyArguments(operation),
  ];
  return parts.join(" \\\n  ");
}

/**
 * Builds the illustrative "authenticated request" shell snippet that pairs
 * with the Integration essentials panel grid. When an API-key header scheme
 * is declared the placeholder uses that header name; otherwise it falls
 * back to a generic bearer-token hint (reference `ApiReferenceContent.astro`
 * bakes an equivalent snippet with `MUSICCLOUD_API_KEY`).
 *
 * @param serverUrl Effective server base URL, when known.
 * @param schemes All declared security schemes.
 */
export function buildIntegrationCurl(
  serverUrl: string | undefined,
  schemes: ApiSecurityScheme[],
): string {
  const apiKeyHeader = schemes.find(
    (scheme) => scheme.type === "apiKey" && scheme.location === "header" && scheme.parameterName,
  );
  const baseUrl = (serverUrl ?? "https://api.example.test").replace(/\/+$/, "");
  if (apiKeyHeader?.parameterName) {
    return `# Requires the API key to be set in your shell environment.
curl ${baseUrl}/resource \\
  -H "${apiKeyHeader.parameterName}: \${API_KEY}" \\
  -H "Content-Type: application/json"`;
  }
  return `curl ${baseUrl}/resource \\
  -H "Authorization: Bearer \${API_TOKEN}" \\
  -H "Content-Type: application/json"`;
}

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

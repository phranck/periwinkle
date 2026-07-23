/**
 * Display-ready API reference model.
 *
 * `buildApiReference()` converts a raw OpenAPI 3.x document into a stable
 * presentation model that hides OpenAPI internals from the rendering layer:
 * operations are grouped and sorted, media types expose resolved local schema
 * names, schema fields are flattened for card rendering, and anchors are
 * precomputed for in-page navigation. Broken documents (unresolved refs,
 * malformed shapes, undeclared security schemes) fail loudly with a clear
 * error message instead of producing a misleading reference.
 */

/**
 * The complete, render-ready API reference derived from one OpenAPI document.
 *
 * @property version API version taken from `info.version`.
 * @property title Human-readable API title taken from `info.title`.
 * @property description Optional API-level Markdown description from `info.description`.
 * @property securitySchemes All security schemes declared by the document, sorted by name.
 * @property groups Operation groups derived from tags, in declared tag order.
 * @property schemas Component schemas by name, sorted alphabetically.
 */
export interface ApiReference {
  version: string;
  title: string;
  description?: string;
  securitySchemes: ApiSecurityScheme[];
  groups: ApiOperationGroup[];
  schemas: Record<string, ApiSchema>;
}

/**
 * One security scheme from `components.securitySchemes`, normalized for display.
 *
 * @property name The scheme key used in `security` requirements.
 * @property type OpenAPI scheme type (`apiKey`, `http`, `oauth2`, `openIdConnect`).
 * @property description Optional authored description of the scheme.
 * @property location For `apiKey` schemes: where the key travels (`header`, `query`, `cookie`).
 * @property parameterName For `apiKey` schemes: the header/query/cookie parameter name.
 * @property httpScheme For `http` schemes: the HTTP auth scheme (`bearer`, `basic`, ...).
 */
export interface ApiSecurityScheme {
  name: string;
  type: string;
  description?: string;
  location?: string;
  parameterName?: string;
  httpScheme?: string;
}

/**
 * A named group of operations, derived from the first tag of each operation.
 *
 * @property name Group label (tag name, or "Other" for untagged operations).
 * @property description Optional description from the document's root `tags` entry.
 * @property operations Operations sorted by path, then method.
 */
export interface ApiOperationGroup {
  name: string;
  description?: string;
  operations: ApiOperation[];
}

/**
 * One HTTP operation, normalized for rendering an endpoint block.
 *
 * @property anchor Stable in-page anchor derived from method and path.
 * @property navTitle Short label for compact navigation, independent from the summary.
 * @property security Names of the security schemes this operation requires (empty = public).
 * @property deprecated True when the contract marks the operation as deprecated.
 */
export interface ApiOperation {
  operationId?: string;
  anchor: string;
  navTitle: string;
  method: string;
  path: string;
  security: string[];
  deprecated: boolean;
  summary?: string;
  description?: string;
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
}

/**
 * One operation parameter (path, query, header, or cookie).
 *
 * @property location The OpenAPI `in` value: `path`, `query`, `header`, or `cookie`.
 * @property schema Raw parameter schema, rendered as a type label by the UI layer.
 */
export interface ApiParameter {
  name: string;
  location: string;
  required: boolean;
  description?: string;
  typeLabel: string;
}

/**
 * Request body of an operation with its media type variants.
 */
export interface ApiRequestBody {
  required: boolean;
  description?: string;
  mediaTypes: ApiMediaType[];
}

/**
 * One response of an operation, keyed by its HTTP status code.
 */
export interface ApiResponse {
  status: string;
  description: string;
  mediaTypes: ApiMediaType[];
}

/**
 * One media type entry of a request body or response.
 *
 * @property schemaRef Direct top-level component schema name, when the payload is a plain ref.
 * @property schemaRefs Named top-level variants of a composed (`oneOf`/`anyOf`/`allOf`) payload.
 * @property schema Raw inline schema for payloads without a component reference.
 * @property example Authored example value, when present.
 */
export interface ApiMediaType {
  mediaType: string;
  schemaRef?: string;
  schemaRefs?: string[];
  schema?: unknown;
  example?: unknown;
}

/**
 * One component schema, flattened for card rendering.
 *
 * @property anchor Stable in-page anchor for schema links.
 * @property fields Human-readable fields, flattened one object level deep.
 * @property variants Named top-level `oneOf`/`anyOf`/`allOf` variants.
 * @property schema The raw OpenAPI schema, kept for example rendering.
 */
export interface ApiSchema {
  name: string;
  anchor: string;
  description?: string;
  fields: ApiSchemaField[];
  variants: ApiSchemaVariant[];
  schema: Record<string, unknown>;
}

/**
 * One flattened schema field row.
 *
 * @property path Local field name; visual nesting conveys its parent.
 * @property depth Visual nesting level, starting at zero for direct properties.
 * @property type Concise JSON type label, including nullability and referenced schema names.
 * @property required Whether the containing object requires this field.
 * @property schemaRef Linked component schema name when the field has a named object type.
 */
export interface ApiSchemaField {
  path: string;
  depth: number;
  type: string;
  required: boolean;
  description?: string;
  schemaRef?: string;
}

/**
 * A named top-level schema variant with its link anchor.
 */
export interface ApiSchemaVariant {
  name: string;
  anchor: string;
}

const HTTP_METHODS = new Set(["get", "put", "post", "delete", "patch", "options", "head", "trace"]);
const LOCAL_SCHEMA_REF_PREFIX = "#/components/schemas/";
const COMPOSITION_KEYWORDS = ["oneOf", "anyOf", "allOf"] as const;

/**
 * Reduces a display label to a URL- and id-safe slug (lowercase, dashes).
 *
 * @param value Arbitrary label text.
 * @returns The slugified value with leading/trailing dashes removed.
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Builds the stable in-page anchor for a component schema.
 *
 * @param name Component schema name as declared in the OpenAPI document.
 * @returns Anchor id usable in `href="#..."` links.
 */
export function schemaAnchor(name: string): string {
  return `schema-${slugify(name)}`;
}

/**
 * Builds the stable in-page anchor for an operation.
 *
 * @param method HTTP method (any casing).
 * @param path OpenAPI path template, e.g. `/books/{id}`.
 * @returns Anchor id usable in `href="#..."` links.
 */
export function operationAnchor(method: string, path: string): string {
  return `op-${slugify(`${method} ${path}`)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function requiredString(value: unknown, label: string): string {
  const result = stringValue(value);
  if (!result) throw new Error(`Invalid OpenAPI document: missing ${label}.`);
  return result;
}

/**
 * Converts a stable OpenAPI operation id into a readable navigation fallback,
 * e.g. `listBookReviews` → `List Book Reviews`.
 *
 * @param operationId The operation id authored in the contract.
 * @returns Title-cased, space-separated label.
 */
function humanizeOperationId(operationId: string): string {
  return operationId
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/**
 * Returns the concise sidebar label for an operation without changing the
 * full endpoint copy. Precedence: authored `x-nav-title`, humanized
 * `operationId`, shortened `summary`, then `METHOD /path`.
 */
function buildNavigationTitle(
  operation: Record<string, unknown>,
  method: string,
  path: string,
): string {
  const authoredTitle = stringValue(operation["x-nav-title"])?.trim();
  if (authoredTitle) return authoredTitle;

  const operationId = stringValue(operation.operationId)?.trim();
  if (operationId) return humanizeOperationId(operationId);

  const summary = stringValue(operation.summary)?.trim();
  if (summary) {
    return (
      summary
        .replace(/\s*\([^)]*\)\s*$/, "")
        .split(/[,;:]/, 1)[0]
        ?.trim() || summary
    );
  }

  return `${method.toUpperCase()} ${path}`;
}

/**
 * Resolves a `$ref` to a local component schema name, or `undefined` when the
 * value is not a reference. Non-local and unknown references fail loudly.
 */
function extractLocalSchemaRef(
  schema: unknown,
  schemas: Record<string, unknown>,
): string | undefined {
  if (!isRecord(schema)) return undefined;
  const ref = stringValue(schema.$ref);
  if (!ref) return undefined;
  if (!ref.startsWith(LOCAL_SCHEMA_REF_PREFIX)) {
    throw new Error(`Unsupported OpenAPI schema reference: ${ref}.`);
  }
  const name = ref.slice(LOCAL_SCHEMA_REF_PREFIX.length);
  if (!schemas[name]) {
    throw new Error(`Unknown OpenAPI schema reference: ${name}.`);
  }
  return name;
}

/**
 * Returns the named schemas at the root of a payload shape. Nested property
 * references are deliberately excluded: they describe fields of one payload,
 * not alternative payloads.
 */
function extractTopLevelSchemaRefs(schema: unknown, schemas: Record<string, unknown>): string[] {
  const directReference = extractLocalSchemaRef(schema, schemas);
  if (directReference) return [directReference];
  if (!isRecord(schema)) return [];

  const references = new Set<string>();
  for (const keyword of COMPOSITION_KEYWORDS) {
    const variants = schema[keyword];
    if (!Array.isArray(variants)) continue;
    for (const variant of variants) {
      const reference = extractLocalSchemaRef(variant, schemas);
      if (reference) references.add(reference);
    }
  }
  return [...references];
}

/**
 * Returns the first named schema a field type points at, used to link field
 * type labels to their schema cards.
 */
function extractSchemaTypeReference(
  schema: unknown,
  schemas: Record<string, unknown>,
): string | undefined {
  const directReference = extractLocalSchemaRef(schema, schemas);
  if (directReference) return directReference;
  if (!isRecord(schema)) return undefined;

  for (const keyword of COMPOSITION_KEYWORDS) {
    const variants = schema[keyword];
    if (!Array.isArray(variants)) continue;
    for (const variant of variants) {
      const reference = extractLocalSchemaRef(variant, schemas);
      if (reference) return reference;
    }
  }
  return undefined;
}

/**
 * Produces a concise, human-readable type label for a schema value.
 *
 * Handles referenced schema names, arrays (`Book[]`), OpenAPI 3.1 type arrays
 * (`["string", "null"]` → `string | null`), 3.0 `nullable`, and composed
 * types (`oneOf` variants joined with `|`).
 */
export function schemaTypeLabel(schema: unknown, schemas: Record<string, unknown>): string {
  if (!isRecord(schema)) return "unknown";

  const typeReference = extractSchemaTypeReference(schema, schemas);
  let baseType: string;
  if (typeReference) {
    baseType = typeReference;
  } else if (schema.type === "array") {
    baseType = `${schemaTypeLabel(schema.items, schemas)}[]`;
  } else if (Array.isArray(schema.type)) {
    const types = schema.type.filter((entry): entry is string => typeof entry === "string");
    baseType = types.length > 0 ? types.join(" | ") : "unknown";
  } else if (typeof schema.type === "string") {
    baseType = schema.type;
  } else {
    const typeVariants = COMPOSITION_KEYWORDS.flatMap((keyword) => {
      const variants = schema[keyword];
      if (!Array.isArray(variants)) return [];
      return variants.map((variant) => schemaTypeLabel(variant, schemas));
    });
    baseType = typeVariants.length > 0 ? [...new Set(typeVariants)].join(" | ") : "object";
  }

  return schema.nullable === true && !baseType.includes("null") ? `${baseType} | null` : baseType;
}

/**
 * Orders object properties for reading: `id` first, other identifiers next,
 * discriminator-style fields after that, everything else in authored order.
 */
function schemaPropertiesInReadingOrder(
  properties: Record<string, unknown>,
): Array<[string, unknown]> {
  const priorityGroups: Array<Array<[string, unknown]>> = [[], [], [], []];

  for (const entry of Object.entries(properties)) {
    const [propertyName] = entry;
    const priority =
      propertyName === "id"
        ? 0
        : propertyName.endsWith("Id")
          ? 1
          : propertyName === "type" || propertyName === "kind" || propertyName.endsWith("Type")
            ? 2
            : 3;
    priorityGroups[priority]?.push(entry);
  }

  return priorityGroups.flat();
}

/**
 * Flattens a schema's properties into display rows, one visible nested level
 * deep. Referenced schemas are followed in place; reference cycles are cut to
 * keep the traversal finite.
 */
function collectSchemaFields(
  schema: Record<string, unknown>,
  schemas: Record<string, unknown>,
): ApiSchemaField[] {
  const fields: ApiSchemaField[] = [];
  const activeReferences = new Set<string>();

  const visit = (value: unknown, parentPath: string, depth: number): void => {
    const reference = extractLocalSchemaRef(value, schemas);
    if (reference) {
      if (activeReferences.has(reference)) return;
      activeReferences.add(reference);
      visit(schemas[reference], parentPath, depth);
      activeReferences.delete(reference);
      return;
    }
    if (!isRecord(value)) return;

    const properties = value.properties;
    if (isRecord(properties)) {
      const requiredProperties = new Set(
        Array.isArray(value.required)
          ? value.required.filter((property): property is string => typeof property === "string")
          : [],
      );
      for (const [propertyName, propertySchema] of schemaPropertiesInReadingOrder(properties)) {
        const nestedPath = parentPath ? `${parentPath}.${propertyName}` : propertyName;
        const schemaReference = extractSchemaTypeReference(propertySchema, schemas);
        // The field-level description wins; when the field just re-uses a
        // referenced component, fall back to that component's description
        // so the key row stays informative even without an inline override.
        const ownDescription = isRecord(propertySchema)
          ? stringValue(propertySchema.description)
          : undefined;
        const referencedDescription =
          !ownDescription && schemaReference && isRecord(schemas[schemaReference])
            ? stringValue((schemas[schemaReference] as Record<string, unknown>).description)
            : undefined;
        const description = ownDescription ?? referencedDescription;
        fields.push({
          path: propertyName,
          depth,
          type: schemaTypeLabel(propertySchema, schemas),
          required: requiredProperties.has(propertyName),
          ...(description ? { description } : {}),
          ...(schemaReference ? { schemaRef: schemaReference } : {}),
        });

        // One visible nested level keeps common payloads scannable without
        // duplicating every component schema throughout the document.
        if (depth === 0) visit(propertySchema, nestedPath, depth + 1);
      }
    }

    if (value.items !== undefined && depth === 0) visit(value.items, `${parentPath}[]`, depth + 1);
    const allOfVariants = value.allOf;
    if (Array.isArray(allOfVariants)) {
      for (const variant of allOfVariants) visit(variant, parentPath, depth);
    }
  };

  visit(schema, "", 0);
  return fields;
}

/**
 * Walks an arbitrary schema value and asserts every `$ref` in it resolves to
 * a declared component schema.
 */
function assertKnownSchemaRefs(value: unknown, schemas: Record<string, unknown>): void {
  if (Array.isArray(value)) {
    for (const item of value) assertKnownSchemaRefs(item, schemas);
    return;
  }
  if (!isRecord(value)) return;

  extractLocalSchemaRef(value, schemas);
  for (const child of Object.values(value)) assertKnownSchemaRefs(child, schemas);
}

function buildMediaTypes(content: unknown, schemas: Record<string, unknown>): ApiMediaType[] {
  if (!isRecord(content)) return [];
  return Object.entries(content)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mediaType, mediaObject]) => {
      if (!isRecord(mediaObject)) return { mediaType };
      const schema = mediaObject.schema;
      const schemaRef = extractLocalSchemaRef(schema, schemas);
      const schemaRefs = extractTopLevelSchemaRefs(schema, schemas);
      if (!schemaRef) assertKnownSchemaRefs(schema, schemas);
      return {
        mediaType,
        ...(schemaRef ? { schemaRef } : schema !== undefined ? { schema } : {}),
        ...(!schemaRef && schemaRefs.length > 0 ? { schemaRefs } : {}),
        ...(mediaObject.example !== undefined ? { example: mediaObject.example } : {}),
      };
    });
}

function buildParameters(value: unknown, schemas: Record<string, unknown>): ApiParameter[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error("Invalid OpenAPI document: operation parameters must be an array.");
  }
  return value.map((parameter) => {
    if (!isRecord(parameter)) {
      throw new Error("Invalid OpenAPI document: parameter must be an object.");
    }
    return {
      name: requiredString(parameter.name, "parameter.name"),
      location: requiredString(parameter.in, "parameter.in"),
      required: parameter.required === true,
      ...(stringValue(parameter.description)
        ? { description: stringValue(parameter.description) }
        : {}),
      typeLabel: schemaTypeLabel(parameter.schema, schemas),
    };
  });
}

function buildRequestBody(
  value: unknown,
  schemas: Record<string, unknown>,
): ApiRequestBody | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) throw new Error("Invalid OpenAPI document: requestBody must be an object.");
  return {
    required: value.required === true,
    ...(stringValue(value.description) ? { description: stringValue(value.description) } : {}),
    mediaTypes: buildMediaTypes(value.content, schemas),
  };
}

function buildResponses(value: unknown, schemas: Record<string, unknown>): ApiResponse[] {
  if (!isRecord(value)) {
    throw new Error("Invalid OpenAPI document: operation responses must be an object.");
  }
  return Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([status, response]) => {
      if (!isRecord(response)) {
        throw new Error("Invalid OpenAPI document: response must be an object.");
      }
      return {
        status,
        description: stringValue(response.description) ?? "",
        mediaTypes: buildMediaTypes(response.content, schemas),
      };
    });
}

/**
 * Normalizes `components.securitySchemes` into display entries, sorted by name.
 */
function buildSecuritySchemes(value: unknown): ApiSecurityScheme[] {
  if (!isRecord(value)) return [];
  return Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, scheme]) => {
      if (!isRecord(scheme)) {
        throw new Error(`Invalid OpenAPI document: security scheme ${name} must be an object.`);
      }
      return {
        name,
        type: requiredString(scheme.type, `securityScheme ${name}.type`),
        ...(stringValue(scheme.description)
          ? { description: stringValue(scheme.description) }
          : {}),
        ...(stringValue(scheme.in) ? { location: stringValue(scheme.in) } : {}),
        ...(stringValue(scheme.name) ? { parameterName: stringValue(scheme.name) } : {}),
        ...(stringValue(scheme.scheme) ? { httpScheme: stringValue(scheme.scheme) } : {}),
      };
    });
}

/**
 * Resolves the effective security requirement names for one operation.
 * Operations without their own `security` inherit the document default.
 * References to undeclared schemes fail loudly.
 */
function buildOperationSecurity(
  operation: Record<string, unknown>,
  documentSecurity: unknown,
  declaredSchemes: ReadonlySet<string>,
  label: string,
): string[] {
  const security = operation.security ?? documentSecurity;
  if (security === undefined) return [];
  if (!Array.isArray(security)) {
    throw new Error(`Invalid OpenAPI document: security of ${label} must be an array.`);
  }
  const names = new Set<string>();
  for (const entry of security) {
    if (!isRecord(entry)) {
      throw new Error(`Invalid OpenAPI document: security entry of ${label} must be an object.`);
    }
    for (const scheme of Object.keys(entry)) {
      if (!declaredSchemes.has(scheme)) {
        throw new Error(
          `Invalid OpenAPI document: ${label} references undeclared security scheme "${scheme}".`,
        );
      }
      names.add(scheme);
    }
  }
  return [...names];
}

function buildSchemas(value: unknown): Record<string, ApiSchema> {
  if (!isRecord(value)) return {};
  const schemas: Record<string, ApiSchema> = {};
  for (const [name, schema] of Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) {
    if (!isRecord(schema)) {
      throw new Error(`Invalid OpenAPI document: schema ${name} must be an object.`);
    }
    schemas[name] = {
      name,
      anchor: schemaAnchor(name),
      ...(stringValue(schema.description) ? { description: stringValue(schema.description) } : {}),
      fields: collectSchemaFields(schema, value),
      variants: extractTopLevelSchemaRefs(schema, value).map((variant) => ({
        name: variant,
        anchor: schemaAnchor(variant),
      })),
      schema,
    };
  }
  return schemas;
}

/**
 * Reads the declared tag order and descriptions from the document's root
 * `tags` array, used to order and annotate operation groups.
 */
function buildTagIndex(value: unknown): Map<string, { order: number; description?: string }> {
  const index = new Map<string, { order: number; description?: string }>();
  if (!Array.isArray(value)) return index;
  for (const [order, entry] of value.entries()) {
    if (!isRecord(entry)) continue;
    const name = stringValue(entry.name);
    if (!name) continue;
    index.set(name, {
      order,
      ...(stringValue(entry.description) ? { description: stringValue(entry.description) } : {}),
    });
  }
  return index;
}

/**
 * Converts an OpenAPI 3.x document into the stable presentation model used by
 * the periwinkle UI layer.
 *
 * Grouping and ordering rules: operations group by their first tag ("Other"
 * when untagged); groups follow the document's root `tags` order, remaining
 * groups alphabetically; operations sort by path, then method; schemas and
 * security schemes sort by name.
 *
 * @param document The parsed OpenAPI document (typically `JSON.parse` output).
 * @returns The normalized {@link ApiReference}.
 * @throws Error with an `Invalid OpenAPI document:` message for malformed
 *   documents, unresolved or non-local `$ref`s, and undeclared security schemes.
 */
export function buildApiReference(document: unknown): ApiReference {
  if (!isRecord(document)) throw new Error("Invalid OpenAPI document: root must be an object.");

  const openapiVersion = requiredString(document.openapi, "openapi version");
  if (!openapiVersion.startsWith("3.")) {
    throw new Error(`Unsupported OpenAPI version: ${openapiVersion}. periwinkle supports 3.x.`);
  }

  const info = document.info;
  if (!isRecord(info)) throw new Error("Invalid OpenAPI document: missing info.");
  const version = requiredString(info.version, "info.version");
  const title = requiredString(info.title, "info.title");

  const components = isRecord(document.components) ? document.components : {};
  const securitySchemes = buildSecuritySchemes(components.securitySchemes);
  const declaredSchemes = new Set(securitySchemes.map((scheme) => scheme.name));

  const rawSchemas = isRecord(components.schemas) ? components.schemas : {};
  for (const schema of Object.values(rawSchemas)) assertKnownSchemaRefs(schema, rawSchemas);
  const schemas = buildSchemas(rawSchemas);

  const paths = document.paths;
  if (!isRecord(paths)) throw new Error("Invalid OpenAPI document: missing paths.");

  const groupsByName = new Map<string, ApiOperation[]>();
  for (const [path, pathItem] of Object.entries(paths).sort(([a], [b]) => a.localeCompare(b))) {
    if (!isRecord(pathItem)) {
      throw new Error(`Invalid OpenAPI document: path item ${path} must be an object.`);
    }
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method)) continue;
      const label = `operation ${method.toUpperCase()} ${path}`;
      if (!isRecord(operation)) {
        throw new Error(`Invalid OpenAPI document: ${label} must be an object.`);
      }

      const tags = Array.isArray(operation.tags)
        ? operation.tags.filter((tag): tag is string => typeof tag === "string")
        : [];
      const groupName = tags[0] ?? "Other";
      const operations = groupsByName.get(groupName) ?? [];
      const requestBody = buildRequestBody(operation.requestBody, rawSchemas);
      operations.push({
        method: method.toUpperCase(),
        path,
        anchor: operationAnchor(method, path),
        navTitle: buildNavigationTitle(operation, method, path),
        security: buildOperationSecurity(operation, document.security, declaredSchemes, label),
        deprecated: operation.deprecated === true,
        ...(stringValue(operation.operationId)
          ? { operationId: stringValue(operation.operationId) }
          : {}),
        ...(stringValue(operation.summary) ? { summary: stringValue(operation.summary) } : {}),
        ...(stringValue(operation.description)
          ? { description: stringValue(operation.description) }
          : {}),
        parameters: buildParameters(operation.parameters, rawSchemas),
        ...(requestBody ? { requestBody } : {}),
        responses: buildResponses(operation.responses, rawSchemas),
      });
      groupsByName.set(groupName, operations);
    }
  }

  const tagIndex = buildTagIndex(document.tags);
  const groups = [...groupsByName.entries()]
    .sort(([a], [b]) => {
      const orderA = tagIndex.get(a)?.order ?? Number.POSITIVE_INFINITY;
      const orderB = tagIndex.get(b)?.order ?? Number.POSITIVE_INFINITY;
      return orderA - orderB || a.localeCompare(b);
    })
    .map(([name, operations]) => ({
      name,
      ...(tagIndex.get(name)?.description ? { description: tagIndex.get(name)?.description } : {}),
      operations: operations.sort(
        (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
      ),
    }));

  return {
    version,
    title,
    ...(stringValue(info.description) ? { description: stringValue(info.description) } : {}),
    securitySchemes,
    groups,
    schemas,
  };
}

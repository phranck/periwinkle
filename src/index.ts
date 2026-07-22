/**
 * periwinkle — static API documentation generator for OpenAPI 3.x.
 *
 * Public library entry point. Consumers import the display model and the
 * React components from here; the CLI in `cli.ts` wraps the same exports.
 * The surface grows with each feature: display model (`buildApiReference()`),
 * config types, and UI components land here as they are implemented.
 */

/**
 * The npm package name, exported as a stable anchor for the public entry
 * point so tooling and tests can assert against the package identity.
 */
export const PACKAGE_NAME = "periwinkle";

export {
  type BuildSiteOptions,
  type BuildSiteResult,
  buildSite,
} from "./build/build-site.jsx";
export { renderHtmlDocument, withBase } from "./build/html.js";
export { ApiDocs } from "./components/ApiDocs.jsx";
export { EndpointBlock } from "./components/EndpointBlock.jsx";
export {
  Chapter,
  CodeBlock,
  Entry,
  InlineMarkdown,
  KeyCap,
  Markdown,
  MethodBadge,
} from "./components/primitives.jsx";
export { SchemaCard } from "./components/SchemaCard.jsx";
export { SearchDialog } from "./components/SearchDialog.jsx";
export { SidebarNav } from "./components/SidebarNav.jsx";
export type {
  CustomSection,
  CustomSectionPosition,
  FooterLink,
  GuideConfig,
  PeriwinkleConfig,
  ResolvedConfig,
  ThemeColors,
  ThemeFonts,
} from "./config/config.js";
export {
  DEFAULT_DARK_COLORS,
  DEFAULT_FONTS,
  DEFAULT_LIGHT_COLORS,
  DEFAULT_RADIUS,
  defineConfig,
  resolveConfig,
} from "./config/config.js";
export { type LoadedConfig, loadConfig } from "./config/load-config.js";
export { compileThemeCss, cssVariableName } from "./config/theme-css.js";
export type {
  ApiMediaType,
  ApiOperation,
  ApiOperationGroup,
  ApiParameter,
  ApiReference,
  ApiRequestBody,
  ApiResponse,
  ApiSchema,
  ApiSchemaField,
  ApiSchemaVariant,
  ApiSecurityScheme,
} from "./model/api-reference.js";
export {
  buildApiReference,
  operationAnchor,
  schemaAnchor,
  schemaTypeLabel,
} from "./model/api-reference.js";
export { startPreviewServer } from "./preview/serve.js";
export { buildCurlExample } from "./render/curl.js";
export { type GuideSection, resolveGuideSections } from "./render/guide.js";
export { type HighlightLanguage, highlightCode } from "./render/highlight.js";
export { renderInlineMarkdown, renderMarkdown } from "./render/markdown.js";
export {
  codeKey,
  type DocsData,
  type PreparedCodeBlock,
  prepareDocsData,
} from "./render/prepare.js";

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

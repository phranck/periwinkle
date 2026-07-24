/**
 * Browser entry point for the config-builder bundle (`config-builder.js`).
 *
 * Bundled as a plain IIFE and loaded with `defer` from the generated
 * `config-builder.html`, so the DOM is complete when this runs.
 */

import { setupConfigBuilder } from "./config-builder.js";

setupConfigBuilder(document);

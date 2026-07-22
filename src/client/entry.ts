/**
 * Browser entry point for the interactivity bundle (`client.js`).
 *
 * Bundled as a plain IIFE and loaded with `defer`, so the DOM is complete
 * when it runs.
 */

import { setupPeriwinkle } from "./client.js";

setupPeriwinkle(document);

/**
 * Minimal static file server for previewing a built site locally.
 *
 * Not a production server: no caching, no compression, no directory
 * listings. It exists so `periwinkle preview` can show a build without any
 * extra tooling.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

/**
 * Starts the preview server for a directory.
 *
 * @param dir Directory containing the built site.
 * @param port TCP port to listen on.
 * @returns The listening {@link Server}; callers close it when done.
 * @throws Error when the directory does not exist.
 */
export function startPreviewServer(dir: string, port: number): Server {
  const root = resolve(dir);
  if (!existsSync(root)) {
    throw new Error(`Preview directory not found: ${root}`);
  }

  const server = createServer((request, response) => {
    const urlPath = decodeURIComponent((request.url ?? "/").split("?")[0] ?? "/");
    // Normalize and re-join so `..` segments can never escape the root.
    let filePath = normalize(join(root, urlPath));
    if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, "index.html");
    }
    if (!existsSync(filePath)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
    const contentType =
      CONTENT_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType }).end(readFileSync(filePath));
  });

  server.listen(port);
  return server;
}

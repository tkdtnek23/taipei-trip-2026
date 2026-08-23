import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const outputDirectory = fileURLToPath(new URL("../pages-dist/", import.meta.url));
const indexPath = join(outputDirectory, "index.html");
const html = await readFile(indexPath, "utf8");
const discoveredAssets = Array.from(
  html.matchAll(/(?:src|href)=["'](\.\/[^"'?#]+)(?:[?#][^"']*)?["']/g),
  (match) => match[1],
);
const precacheUrls = Array.from(new Set(["./", "./index.html", ...discoveredAssets]));
const version = createHash("sha256").update(html).digest("hex").slice(0, 12);

const serviceWorker = `const CACHE_PREFIX = "taipei-trip-cache-";
const CACHE_NAME = \`${"${CACHE_PREFIX}"}${version}\`;
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};
const scopeUrl = new URL(self.registration.scope);
const scopedUrl = (path) => new URL(path, scopeUrl).href;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS.map(scopedUrl));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        .map((name) => caches.delete(name)),
    );
    await self.clients.claim();
  })());
});

async function loadPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(scopedUrl("./"), response.clone());
    }
    return response;
  } catch {
    return await caches.match(scopedUrl("./"))
      ?? await caches.match(scopedUrl("./index.html"))
      ?? Response.error();
  }
}

async function loadAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(loadPage(request));
    return;
  }
  event.respondWith(loadAsset(request));
});
`;

await writeFile(join(outputDirectory, "sw.js"), serviceWorker);

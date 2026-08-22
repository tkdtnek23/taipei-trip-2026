import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Taipei itinerary", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>타이베이 3박 4일 일정표<\/title>/i);
  assert.match(html, /대만 타이베이 3박 4일/);
  assert.match(html, /여행 준비 체크리스트/);
  assert.match(html, /화산1914와 다다오청 노을/);
  assert.match(html, /고궁박물원·베이터우 족욕·스린 야시장/);
  assert.match(html, /09:45 B1 GTS 안내문 앞 집결/);
  assert.doesNotMatch(html, /입장권 28,194원\+투어/);
  assert.match(html, /<th scope="col">일정<\/th>/);
  assert.match(html, /data-label="이동"/);
  assert.match(html, /data-label="비용"/);
  assert.match(html, /전체 경로/);
  assert.match(html, /aria-current="date"/);
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /접기 ↑/);
  assert.match(html, /Google 로그인/);
  assert.doesNotMatch(html, /mo\.myrealtrip\.com\/auj8zx/);
  assert.doesNotMatch(html, /codex-preview|Building your site|SkeletonPreview/i);
});

test("builds a GitHub Pages static entry", async () => {
  const [html, workflow, packageJson] = await Promise.all([
    readFile(new URL("../pages-dist/index.html", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/deploy-pages.yml", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /width=device-width, initial-scale=1, viewport-fit=cover/);
  assert.match(html, /assets\/index-[^"']+\.js/);
  assert.match(html, /assets\/index-[^"']+\.css/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(packageJson, /"build:pages"/);
});

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HTML_PATH = join(ROOT, "index.html");
const LOGO_PATH = join(
  ROOT,
  "assets",
  "reference",
  "evolution-logo-instagram.jpeg",
);
const OUTPUT_PATH = join(ROOT, "dist", "server", "index.js");

const html = await readFile(HTML_PATH, "utf8");
const logoBase64 = (await readFile(LOGO_PATH)).toString("base64");

const worker = `
const HTML = ${JSON.stringify(html)};
const LOGO_BASE64 = ${JSON.stringify(logoBase64)};
const LOGO_BYTES = Uint8Array.from(atob(LOGO_BASE64), (character) =>
  character.charCodeAt(0),
);

function responseFor(request, body, init) {
  return new Response(request.method === "HEAD" ? null : body, init);
}

export default {
  async fetch(request) {
    const { pathname } = new URL(request.url);

    if (pathname === "/" || pathname === "/index.html") {
      return responseFor(request, HTML, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    if (
      pathname === "/assets/reference/evolution-logo-instagram.jpeg" ||
      pathname === "/favicon.ico"
    ) {
      return responseFor(request, LOGO_BYTES, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=86400",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return responseFor(request, "Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
};
`.trimStart();

await mkdir(dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, worker, "utf8");
console.log("Built dist/server/index.js");

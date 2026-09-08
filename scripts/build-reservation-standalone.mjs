import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const prototype = resolve(root, "reservation-prototype");
const assets = resolve(prototype, "assets");
const fonts = resolve(assets, "fonts");

const asDataUrl = async (path, mime) => {
  const contents = await readFile(path);
  return `data:${mime};base64,${contents.toString("base64")}`;
};

// `sourceFile` decide qué flujo se empaqueta, sin duplicar el inlineado de
// fuentes/íconos/logo. Por defecto es index.html (la demo simulada que sirve
// el pipeline de Sites, que llama a esta función sin argumentos y por lo
// tanto no cambia); build-cloudflare.mjs pasa index.real.html.
export async function buildReservationStandaloneHtml(sourceFile = "index.html") {
  const [
    sourceHtml,
    sourceFontsCss,
    sourceIconsCss,
    logoUrl,
    cormorantUrl,
    jostUrl,
    iconsUrl,
  ] = await Promise.all([
    readFile(resolve(prototype, sourceFile), "utf8"),
    readFile(resolve(assets, "fonts.css"), "utf8"),
    readFile(resolve(assets, "bootstrap-icons.css"), "utf8"),
    asDataUrl(resolve(assets, "evolution-logo-instagram.jpeg"), "image/jpeg"),
    asDataUrl(resolve(fonts, "cormorant-garamond-latin.woff2"), "font/woff2"),
    asDataUrl(resolve(fonts, "jost-latin.woff2"), "font/woff2"),
    asDataUrl(resolve(fonts, "bootstrap-icons.woff2"), "font/woff2"),
  ]);

  const fontsCss = sourceFontsCss
    .replace('url("fonts/cormorant-garamond-latin.woff2")', `url("${cormorantUrl}")`)
    .replace('url("fonts/jost-latin.woff2")', `url("${jostUrl}")`);

  const iconsCss = sourceIconsCss
    .replace(/\/\*![\s\S]*?\*\//, "")
    .replace(
      /src:url\("fonts\/bootstrap-icons\.woff2\?[^)]*\) format\("woff2"\),url\("fonts\/bootstrap-icons\.woff\?[^)]*\) format\("woff"\)/,
      `src:url("${iconsUrl}") format("woff2")`,
    );

  return sourceHtml
    .replace('<link href="assets/fonts.css" rel="stylesheet">', `<style>\n${fontsCss}\n</style>`)
    .replace('<link rel="stylesheet" href="assets/bootstrap-icons.css">', `<style>\n${iconsCss}\n</style>`)
    .replace('src="assets/evolution-logo-instagram.jpeg"', `src="${logoUrl}"`)
    .replace(/<div id="codex-browser-sidebar-comments-root"[^>]*><\/div>/, "")
    .replace("</body></html>", "</body>\n</html>");
}

export async function writeReservationStandalone() {
  const output = resolve(prototype, "evolution-studio-reserva-standalone.html");
  await writeFile(output, await buildReservationStandaloneHtml(), "utf8");
  return output;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  console.log(await writeReservationStandalone());
}

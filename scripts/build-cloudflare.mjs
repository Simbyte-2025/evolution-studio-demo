// Pipeline de build INDEPENDIENTE para el Worker de Cloudflare (Propuesta 1
// real). No toca scripts/build-sites.mjs ni dist/server/index.js — el
// pipeline de Sites sigue publicando exactamente igual, en paralelo.
//
// A diferencia de build-sites.mjs (que genera un Worker con el HTML
// inlineado como strings JS), este script escribe archivos estáticos reales
// en public/, servidos por Cloudflare Workers Static Assets. La lógica de
// backend (/api/*) vive en src/index.js, no en este script.
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildReservationStandaloneHtml } from "./build-reservation-standalone.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HTML_PATH = join(ROOT, "index.html");
const LOGO_PATH = join(ROOT, "assets", "reference", "evolution-logo-instagram.jpeg");
const PUBLIC_DIR = join(ROOT, "public");

const html = await readFile(HTML_PATH, "utf8");
// index.real.html — el flujo conectado a /api/*. NUNCA index.html: esa es la
// fuente de la demo simulada que sirve el pipeline de Sites, ya publicada.
const bookingHtml = await buildReservationStandaloneHtml("index.real.html");

await mkdir(PUBLIC_DIR, { recursive: true });
await mkdir(join(PUBLIC_DIR, "reservar"), { recursive: true });
await mkdir(join(PUBLIC_DIR, "assets", "reference"), { recursive: true });

await writeFile(join(PUBLIC_DIR, "index.html"), html, "utf8");
await writeFile(join(PUBLIC_DIR, "reservar", "index.html"), bookingHtml, "utf8");
await copyFile(LOGO_PATH, join(PUBLIC_DIR, "assets", "reference", "evolution-logo-instagram.jpeg"));
await copyFile(LOGO_PATH, join(PUBLIC_DIR, "favicon.ico"));

console.log("Built public/ for Cloudflare Worker Static Assets");

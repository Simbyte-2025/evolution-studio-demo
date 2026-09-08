// Utilidad LOCAL y de UN SOLO USO para obtener el refresh_token de la cuenta
// organizadora (agenda.evolution.demo@gmail.com).
//
// Deliberadamente NO existe una ruta pública /api/oauth/callback ni un botón
// "Conectar con Google" en la landing: la autorización la hace una persona
// una vez, desde su terminal, y el token queda en .dev.vars (no versionado).
// El Worker desplegado nunca participa de este flujo.
//
//   node scripts/oauth-setup.mjs
//
// Requiere GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET ya presentes en .dev.vars
// (ver docs/OAUTH-SETUP.md para crear el cliente OAuth de escritorio).

import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const CALLBACK_PORT = 8976;
const REDIRECT_URI = `http://127.0.0.1:${CALLBACK_PORT}/callback`;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEV_VARS_PATH = resolve(ROOT, '.dev.vars');

// ── Piezas puras (con test en oauth-setup.test.js) ──────────────────────

export function buildAuthUrl({ clientId, redirectUri, codeChallenge, state }) {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', CALENDAR_SCOPE);
  // access_type=offline y prompt=consent son imprescindibles: sin ellos
  // Google entrega solo un access_token de una hora y ningún refresh_token,
  // sin devolver ningún error.
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  return url.toString();
}

// Reescribe una variable en el contenido de .dev.vars conservando el resto
// del archivo (comentarios y otras variables incluidos).
export function upsertDevVar(contents, name, value) {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, 'm');

  if (pattern.test(contents)) return contents.replace(pattern, line);

  const base = contents.length === 0 || contents.endsWith('\n') ? contents : `${contents}\n`;
  return `${base}${line}\n`;
}

export function parseDevVars(contents) {
  const vars = {};
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    vars[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return vars;
}

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── Flujo interactivo ───────────────────────────────────────────────────

function waitForAuthorizationCode(expectedState) {
  return new Promise((fulfil, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${CALLBACK_PORT}`);
      if (url.pathname !== '/callback') {
        res.writeHead(404).end();
        return;
      }

      const respond = (message) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html><meta charset="utf-8"><body style="font-family:system-ui;padding:40px">
          <p>${message}</p><p>Puedes cerrar esta pestaña y volver a la terminal.</p></body>`);
      };

      const error = url.searchParams.get('error');
      if (error) {
        respond('Autorización cancelada.');
        server.close();
        reject(new Error(`Google devolvió un error de autorización: ${error}`));
        return;
      }

      if (url.searchParams.get('state') !== expectedState) {
        respond('Estado inválido.');
        server.close();
        reject(new Error('El parámetro `state` no coincide: se aborta por seguridad.'));
        return;
      }

      const code = url.searchParams.get('code');
      if (!code) {
        respond('Falta el código de autorización.');
        server.close();
        reject(new Error('Google no devolvió el parámetro `code`.'));
        return;
      }

      respond('Autorización recibida.');
      server.close();
      fulfil(code);
    });

    server.on('error', reject);
    server.listen(CALLBACK_PORT, '127.0.0.1');
  });
}

function openInBrowser(url) {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  try {
    spawn(command, [url], { stdio: 'ignore', detached: true }).unref();
    return true;
  } catch {
    return false;
  }
}

async function exchangeCodeForTokens({ code, clientId, clientSecret, codeVerifier }) {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) {
    throw new Error(`El intercambio del código falló: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  let devVarsContents;
  try {
    devVarsContents = await readFile(DEV_VARS_PATH, 'utf8');
  } catch {
    console.error(
      'No encontré .dev.vars. Copia .dev.vars.example a .dev.vars y completa\n' +
        'GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET antes de correr esta utilidad.'
    );
    process.exitCode = 1;
    return;
  }

  const vars = parseDevVars(devVarsContents);
  const clientId = vars.GOOGLE_CLIENT_ID;
  const clientSecret = vars.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId.includes('reemplazar') || clientSecret.includes('reemplazar')) {
    console.error('Falta completar GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET en .dev.vars.');
    process.exitCode = 1;
    return;
  }

  const codeVerifier = base64url(randomBytes(32));
  const codeChallenge = base64url(createHash('sha256').update(codeVerifier).digest());
  const state = base64url(randomBytes(16));

  const authUrl = buildAuthUrl({ clientId, redirectUri: REDIRECT_URI, codeChallenge, state });
  const pending = waitForAuthorizationCode(state);

  console.log('\nAbriendo el navegador para autorizar el acceso a Google Calendar.');
  console.log('Inicia sesión con la cuenta ORGANIZADORA (agenda.evolution.demo@gmail.com).\n');
  if (!openInBrowser(authUrl)) {
    console.log('No pude abrir el navegador. Abre este enlace manualmente:\n');
    console.log(authUrl, '\n');
  }

  const code = await pending;
  const tokens = await exchangeCodeForTokens({ code, clientId, clientSecret, codeVerifier });

  if (!tokens.refresh_token) {
    console.error(
      'Google no devolvió refresh_token. Suele pasar cuando la cuenta ya había\n' +
        'autorizado esta app: revoca el acceso en https://myaccount.google.com/permissions\n' +
        'y vuelve a correr la utilidad.'
    );
    process.exitCode = 1;
    return;
  }

  // El token nunca se imprime: se escribe directo en .dev.vars, que está
  // ignorado por Git.
  const updated = upsertDevVar(devVarsContents, 'GOOGLE_REFRESH_TOKEN', tokens.refresh_token);
  await writeFile(DEV_VARS_PATH, updated, 'utf8');

  console.log('\n✓ refresh_token guardado en .dev.vars (no versionado).');
  console.log('  No se imprimió en pantalla a propósito.');
  console.log(`  Alcance concedido: ${tokens.scope ?? '(no informado)'}\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  await main();
}

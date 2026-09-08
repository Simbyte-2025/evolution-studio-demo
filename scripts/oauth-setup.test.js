import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAuthUrl,
  upsertDevVar,
  extractAuthorizationCode,
  startCallbackServer,
  OAuthCallbackError,
  CALENDAR_SCOPE,
} from './oauth-setup.mjs';

test('the authorization URL asks for the parameters Google needs to return a refresh token', () => {
  const url = new URL(
    buildAuthUrl({
      clientId: 'fake-client-id.apps.googleusercontent.example',
      redirectUri: 'http://127.0.0.1:8976/callback',
      codeChallenge: 'fake-challenge',
      state: 'fake-state',
    })
  );

  assert.equal(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  // Sin access_type=offline Google devuelve solo un access_token de una hora
  // y ningún refresh_token — la utilidad quedaría inservible sin ningún error.
  assert.equal(url.searchParams.get('access_type'), 'offline');
  // Sin prompt=consent, una segunda autorización de la misma cuenta tampoco
  // devuelve refresh_token.
  assert.equal(url.searchParams.get('prompt'), 'consent');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('scope'), CALENDAR_SCOPE);
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('code_challenge'), 'fake-challenge');
  assert.equal(url.searchParams.get('state'), 'fake-state');
  assert.equal(url.searchParams.get('redirect_uri'), 'http://127.0.0.1:8976/callback');
});

test('upsertDevVar replaces an existing value without disturbing the other lines', () => {
  const before = [
    '# comentario',
    'GOOGLE_CLIENT_ID=abc',
    'GOOGLE_REFRESH_TOKEN=viejo',
    'OWNER_EMAIL=alguien@example.com',
    '',
  ].join('\n');

  const after = upsertDevVar(before, 'GOOGLE_REFRESH_TOKEN', 'nuevo');

  assert.match(after, /^GOOGLE_REFRESH_TOKEN=nuevo$/m);
  assert.doesNotMatch(after, /viejo/);
  assert.match(after, /^GOOGLE_CLIENT_ID=abc$/m);
  assert.match(after, /^OWNER_EMAIL=alguien@example\.com$/m);
  assert.match(after, /^# comentario$/m);
  // No debe duplicar la clave.
  assert.equal(after.match(/^GOOGLE_REFRESH_TOKEN=/gm).length, 1);
});

test('upsertDevVar appends the variable when the file does not have it yet', () => {
  const after = upsertDevVar('GOOGLE_CLIENT_ID=abc\n', 'GOOGLE_REFRESH_TOKEN', 'nuevo');

  assert.match(after, /^GOOGLE_CLIENT_ID=abc$/m);
  assert.match(after, /^GOOGLE_REFRESH_TOKEN=nuevo$/m);
});

test('upsertDevVar works on an empty file without producing a leading blank line', () => {
  assert.equal(upsertDevVar('', 'GOOGLE_REFRESH_TOKEN', 'nuevo'), 'GOOGLE_REFRESH_TOKEN=nuevo\n');
});

test('upsertDevVar does not confuse a variable with another one sharing its prefix', () => {
  const before = 'BARBER_A_CALENDAR_ID=uno\nBARBER_A_CALENDAR_ID_OLD=dos\n';

  const after = upsertDevVar(before, 'BARBER_A_CALENDAR_ID', 'tres');

  assert.match(after, /^BARBER_A_CALENDAR_ID=tres$/m);
  assert.match(after, /^BARBER_A_CALENDAR_ID_OLD=dos$/m);
});

// ── Protección CSRF por `state` ────────────────────────────────────────
// Sin esta verificación, un tercero podría inducir al navegador a entregar
// en este callback un código de autorización que no corresponde a esta
// sesión. Cualquier rechazo debe ocurrir ANTES de intercambiar el código.

test('extractAuthorizationCode rejects a callback whose state does not match', () => {
  const params = new URLSearchParams({ code: 'codigo-de-google', state: 'state-de-un-atacante' });

  assert.throws(
    () => extractAuthorizationCode(params, 'state-legitimo'),
    (err) => err instanceof OAuthCallbackError && /state/.test(err.message)
  );
});

test('extractAuthorizationCode rejects a callback with no state at all', () => {
  const params = new URLSearchParams({ code: 'codigo-de-google' });

  assert.throws(
    () => extractAuthorizationCode(params, 'state-legitimo'),
    (err) => err instanceof OAuthCallbackError && /state/.test(err.message)
  );
});

test('extractAuthorizationCode rejects an empty state even if expectedState were empty', () => {
  // Defensa contra el caso degenerado '' === '': un state vacío nunca sirve.
  assert.throws(
    () => extractAuthorizationCode(new URLSearchParams({ code: 'c', state: '' }), ''),
    OAuthCallbackError
  );
});

test('extractAuthorizationCode rejects an authorization the user cancelled', () => {
  const params = new URLSearchParams({ error: 'access_denied', state: 'state-legitimo' });

  assert.throws(() => extractAuthorizationCode(params, 'state-legitimo'), OAuthCallbackError);
});

test('extractAuthorizationCode returns the code when the state matches', () => {
  const params = new URLSearchParams({ code: 'codigo-de-google', state: 'state-legitimo' });

  assert.equal(extractAuthorizationCode(params, 'state-legitimo'), 'codigo-de-google');
});

test('the callback server listens only on the loopback interface', async () => {
  const { ready, code, close } = startCallbackServer('state-legitimo', { port: 0 });
  const address = await ready;

  assert.equal(address.address, '127.0.0.1');

  code.catch(() => {}); // nadie va a completar el flujo en este test
  close();
});

test('a callback with the wrong state is refused and the server shuts down', async () => {
  const { ready, code } = startCallbackServer('state-legitimo', { port: 0 });
  const { port } = await ready;

  // El handler se adjunta ANTES de provocar el rechazo: si no, el rechazo
  // queda momentáneamente sin manejar y el runner lo cuenta como fallo.
  const expectRejection = assert.rejects(
    code,
    (err) => err instanceof OAuthCallbackError && /state/.test(err.message)
  );

  const res = await fetch(`http://127.0.0.1:${port}/callback?code=robado&state=state-de-un-atacante`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /rechazada/);

  await expectRejection;

  // El servidor debe haberse cerrado: una segunda solicitud no encuentra a
  // nadie escuchando.
  await assert.rejects(fetch(`http://127.0.0.1:${port}/callback?code=otro&state=state-legitimo`));
});

test('a callback with the right state resolves with the code and shuts the server down', async () => {
  const { ready, code } = startCallbackServer('state-legitimo', { port: 0 });
  const { port } = await ready;

  await fetch(`http://127.0.0.1:${port}/callback?code=codigo-de-google&state=state-legitimo`);

  assert.equal(await code, 'codigo-de-google');
  await assert.rejects(fetch(`http://127.0.0.1:${port}/callback?code=otro&state=state-legitimo`));
});

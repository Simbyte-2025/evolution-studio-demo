import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refreshAccessToken } from './google-oauth.js';

function makeFetchMock(response) {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, opts });
    return {
      ok: response.ok,
      status: response.status,
      json: async () => response.body,
      text: async () => JSON.stringify(response.body),
    };
  };
  return { fetchImpl, calls };
}

test('refreshAccessToken posts client credentials + refresh_token and returns the access token', async () => {
  const { fetchImpl, calls } = makeFetchMock({
    ok: true,
    status: 200,
    body: { access_token: 'fake-access-token', expires_in: 3599 },
  });

  const result = await refreshAccessToken({
    clientId: 'fake-client-id',
    clientSecret: 'fake-client-secret',
    refreshToken: 'fake-refresh-token',
    fetchImpl,
  });

  assert.equal(result.accessToken, 'fake-access-token');
  assert.equal(result.expiresIn, 3599);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://oauth2.googleapis.com/token');
  assert.equal(calls[0].opts.method, 'POST');
  const sentBody = new URLSearchParams(calls[0].opts.body);
  assert.equal(sentBody.get('client_id'), 'fake-client-id');
  assert.equal(sentBody.get('client_secret'), 'fake-client-secret');
  assert.equal(sentBody.get('refresh_token'), 'fake-refresh-token');
  assert.equal(sentBody.get('grant_type'), 'refresh_token');
});

test('refreshAccessToken throws a descriptive error when Google responds with an error', async () => {
  const { fetchImpl } = makeFetchMock({
    ok: false,
    status: 400,
    body: { error: 'invalid_grant' },
  });

  await assert.rejects(
    () => refreshAccessToken({ clientId: 'x', clientSecret: 'y', refreshToken: 'expired', fetchImpl }),
    /OAuth refresh failed: 400/
  );
});

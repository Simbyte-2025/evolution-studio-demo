// OAuth 2.0 tipo "Aplicación de escritorio": no hay JWT/RS256 que firmar
// (eso es solo para cuentas de servicio, que este proyecto no usa). El
// refresh_token se obtuvo una sola vez con scripts/oauth-setup.mjs y se
// intercambia aquí por un access_token de corta duración en cada request.
export async function refreshAccessToken({ clientId, clientSecret, refreshToken, fetchImpl = fetch }) {
  const res = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth refresh failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

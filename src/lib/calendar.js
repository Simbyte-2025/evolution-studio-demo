export class CalendarError extends Error {}

const BASE32HEX_ALPHABET = '0123456789abcdefghijklmnopqrstuv';

// Google Calendar exige ids en minúsculas, alfabeto base32hex (0-9a-v),
// longitud 5-1024. Se deriva de forma determinística de idempotencyKey vía
// SHA-256, así reintentos del mismo envío (misma clave, no regenerada)
// producen siempre el mismo event.id.
export async function deriveEventId(idempotencyKey) {
  const data = new TextEncoder().encode(idempotencyKey);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);

  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32HEX_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32HEX_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export async function queryFreeBusy({ accessToken, calendarId, timeMin, timeMax, fetchImpl = fetch }) {
  const res = await fetchImpl('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: calendarId }] }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new CalendarError(`freeBusy.query failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const busy = data.calendars?.[calendarId]?.busy ?? [];
  return busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

// Crea el evento con id explícito (derivado de idempotencyKey) y
// sendUpdates=all como QUERY PARAM de events.insert (no en el body — ahí no
// tiene efecto y el evento se crearía sin invitar a nadie, sin ningún error
// visible). Si Google responde 409 porque el id ya existe, se consulta el
// evento existente y solo se trata como éxito idempotente si su
// extendedProperties.private.bookingId coincide con esta reserva.
export async function createBookingEvent({
  accessToken,
  calendarId,
  eventId,
  bookingId,
  summary,
  description,
  start,
  end,
  timeZone,
  attendees,
  fetchImpl = fetch,
}) {
  const body = {
    id: eventId,
    summary,
    description,
    start: { dateTime: start, timeZone },
    end: { dateTime: end, timeZone },
    attendees,
    transparency: 'opaque',
    extendedProperties: { private: { bookingId } },
  };

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`;
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 409) {
    return resolveEventConflict({ accessToken, calendarId, eventId, bookingId, fetchImpl });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new CalendarError(`events.insert failed: ${res.status} ${text}`);
  }

  const created = await res.json();
  return { event: created, idempotent: false };
}

// Busca un evento por id. Devuelve `null` si no existe (404) — nunca lanza
// por "no encontrado", solo por fallas reales de la API.
export async function getExistingBookingEvent({ accessToken, calendarId, eventId, fetchImpl = fetch }) {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  const res = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new CalendarError(`events.get failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function resolveEventConflict({ accessToken, calendarId, eventId, bookingId, fetchImpl }) {
  const existing = await getExistingBookingEvent({ accessToken, calendarId, eventId, fetchImpl });

  if (!existing) {
    throw new CalendarError(
      'events.insert conflict (409) but the existing event could not be found (transient state?)'
    );
  }

  const existingBookingId = existing?.extendedProperties?.private?.bookingId;

  if (existingBookingId !== bookingId) {
    throw new CalendarError(
      'events.insert conflict (409): an event with this id already exists but belongs to a different booking'
    );
  }

  return { event: existing, idempotent: true };
}

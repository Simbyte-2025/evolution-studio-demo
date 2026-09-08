import { findServiceById, findBarberById } from '../lib/fixtures/demo-config.js';
import { zonedTimeToUtc, formatRfc3339 } from '../lib/time.js';
import { refreshAccessToken } from '../lib/google-oauth.js';
import { queryFreeBusy, createBookingEvent, deriveEventId, CalendarError } from '../lib/calendar.js';
import { ApiError } from '../lib/errors.js';

const PHONE_PATTERN = /^\+?[0-9 ]{6,20}$/;

function validateBookingInput(input) {
  const { serviceId, barberId, date, time, name, phone, idempotencyKey } = input ?? {};

  if (!serviceId || !barberId) throw new ApiError(400, 'MISSING_SERVICE_OR_BARBER');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) throw new ApiError(400, 'INVALID_DATE');
  if (!/^\d{2}:\d{2}$/.test(time ?? '')) throw new ApiError(400, 'INVALID_TIME');

  const trimmedName = (name ?? '').trim();
  if (trimmedName.length < 2 || trimmedName.length > 80) throw new ApiError(400, 'INVALID_NAME');

  const trimmedPhone = (phone ?? '').trim();
  if (!PHONE_PATTERN.test(trimmedPhone)) throw new ApiError(400, 'INVALID_PHONE');

  if (!idempotencyKey || String(idempotencyKey).length < 8) throw new ApiError(400, 'MISSING_IDEMPOTENCY_KEY');

  return { serviceId, barberId, date, time, name: trimmedName, phone: trimmedPhone, idempotencyKey };
}

// POST /api/bookings
export async function createBooking({ input, env, fetchImpl = fetch }) {
  const { serviceId, barberId, date, time, name, phone, idempotencyKey } = validateBookingInput(input);

  const service = findServiceById(serviceId);
  if (!service) throw new ApiError(400, 'SERVICE_NOT_FOUND');

  const barber = findBarberById(barberId);
  if (!barber) throw new ApiError(400, 'BARBER_NOT_FOUND');

  const calendarId = env[barber.calendarEnvKey];
  if (!calendarId) throw new ApiError(500, 'BARBER_CALENDAR_NOT_CONFIGURED');

  const timeZone = env.BUSINESS_TIMEZONE || 'America/Santiago';
  const startInstant = zonedTimeToUtc(date, time, timeZone);
  const endInstant = new Date(startInstant.getTime() + service.duracion_min * 60000);

  const { accessToken } = await refreshAccessToken({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    refreshToken: env.GOOGLE_REFRESH_TOKEN,
    fetchImpl,
  });

  // Revalidación best-effort inmediatamente antes de confirmar (no es una
  // garantía transaccional: dos solicitudes verdaderamente simultáneas
  // podrían pasar ambas esta comprobación — ver plan, sección de
  // concurrencia). La protección contra reintentos del MISMO envío es el
  // event.id derivado de idempotencyKey, manejado en calendar.js.
  const busy = await queryFreeBusy({
    accessToken,
    calendarId,
    timeMin: startInstant.toISOString(),
    timeMax: endInstant.toISOString(),
    fetchImpl,
  });
  const overlaps = busy.some((b) => startInstant < b.end && endInstant > b.start);
  if (overlaps) throw new ApiError(409, 'SLOT_UNAVAILABLE');

  const eventId = await deriveEventId(idempotencyKey);
  const bookingId = `EV-${eventId.slice(0, 8).toUpperCase()}`;

  const attendees = [env[barber.emailEnvKey], env.OWNER_EMAIL]
    .filter(Boolean)
    .map((email) => ({ email }));

  let created;
  try {
    created = await createBookingEvent({
      accessToken,
      calendarId,
      eventId,
      bookingId,
      summary: `${service.nombre} — ${name}`,
      description: [
        `Reserva: ${bookingId}`,
        `Cliente: ${name}`,
        `Teléfono: ${phone}`,
        `Servicio: ${service.nombre}`,
        `Barbero: ${barber.nombre}`,
        'Origen: evolution-landing',
      ].join('\n'),
      start: formatRfc3339(startInstant, timeZone),
      end: formatRfc3339(endInstant, timeZone),
      timeZone,
      attendees,
      fetchImpl,
    });
  } catch (err) {
    // El frontend solo debe mostrar "confirmada" cuando events.insert
    // termina bien — un fallo de Calendar nunca se presenta como éxito.
    if (err instanceof CalendarError) throw new ApiError(502, 'CALENDAR_CREATE_FAILED');
    throw err;
  }

  return {
    bookingId,
    calendarEventId: created.event.id,
    idempotent: created.idempotent,
  };
}

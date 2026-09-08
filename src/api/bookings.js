import { findServiceById, findBarberById } from '../lib/fixtures/demo-config.js';
import { zonedTimeToUtc, formatRfc3339 } from '../lib/time.js';
import { refreshAccessToken } from '../lib/google-oauth.js';
import {
  queryFreeBusy,
  createBookingEvent,
  getExistingBookingEvent,
  deriveEventId,
  CalendarError,
} from '../lib/calendar.js';
import { ApiError } from '../lib/errors.js';
import { normalizePhone } from '../lib/phone.js';

// Las notas van al evento de Calendar, que el barbero lee: se acotan pero
// nunca se truncan en silencio — si el cliente escribe de más, se le avisa.
const MAX_NOTES_LENGTH = 500;

function validateBookingInput(input) {
  const { serviceId, barberId, date, time, name, phone, notes, idempotencyKey } = input ?? {};

  if (!serviceId || !barberId) throw new ApiError(400, 'MISSING_SERVICE_OR_BARBER');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) throw new ApiError(400, 'INVALID_DATE');
  if (!/^\d{2}:\d{2}$/.test(time ?? '')) throw new ApiError(400, 'INVALID_TIME');

  const trimmedName = (name ?? '').trim();
  if (trimmedName.length < 2 || trimmedName.length > 80) throw new ApiError(400, 'INVALID_NAME');

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) throw new ApiError(400, 'INVALID_PHONE');

  const trimmedNotes = (notes ?? '').trim();
  if (trimmedNotes.length > MAX_NOTES_LENGTH) throw new ApiError(400, 'INVALID_NOTES');

  if (!idempotencyKey || String(idempotencyKey).length < 8) throw new ApiError(400, 'MISSING_IDEMPOTENCY_KEY');

  return {
    serviceId,
    barberId,
    date,
    time,
    name: trimmedName,
    phone: normalizedPhone,
    notes: trimmedNotes,
    idempotencyKey,
  };
}

// POST /api/bookings
export async function createBooking({ input, env, fetchImpl = fetch }) {
  const { serviceId, barberId, date, time, name, phone, notes, idempotencyKey } = validateBookingInput(input);

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

  const eventId = await deriveEventId(idempotencyKey);
  const bookingId = `EV-${eventId.slice(0, 8).toUpperCase()}`;

  // Pre-check de idempotencia: si esta MISMA idempotencyKey ya produjo un
  // evento antes (reintento de red, doble envío ya resuelto), se detecta acá
  // ANTES de freeBusy. Es imprescindible hacerlo en este orden: una vez que
  // el evento existe, freeBusy lo reporta como "ocupado" — y ese "ocupado"
  // sería por la propia reserva del cliente, no por otra persona. Si se
  // consultara freeBusy primero, todo reintento legítimo recibiría
  // erróneamente 409 SLOT_UNAVAILABLE en vez de la confirmación idempotente.
  const preexisting = await getExistingBookingEvent({ accessToken, calendarId, eventId, fetchImpl });
  if (preexisting) {
    const preexistingBookingId = preexisting?.extendedProperties?.private?.bookingId;
    if (preexistingBookingId !== bookingId) {
      // Colisión de hash entre dos reservas distintas (astronómicamente
      // improbable, pero no silenciada): no es "horario ocupado", es un
      // problema de generación de id que un reintento no puede resolver.
      throw new ApiError(500, 'BOOKING_ID_COLLISION');
    }
    return { bookingId, calendarEventId: preexisting.id, idempotent: true };
  }

  // Revalidación best-effort inmediatamente antes de confirmar (no es una
  // garantía transaccional: dos solicitudes verdaderamente simultáneas con
  // idempotencyKey DISTINTAS podrían pasar ambas esta comprobación — ver
  // plan, sección de concurrencia). El pre-check de arriba ya descartó que
  // esto sea un reintento del mismo envío; si events.insert aun así choca
  // con un 409 por una carrera entre el pre-check y el insert, calendar.js
  // lo resuelve igual con el mismo criterio de bookingId coincidente.
  const busy = await queryFreeBusy({
    accessToken,
    calendarId,
    timeMin: startInstant.toISOString(),
    timeMax: endInstant.toISOString(),
    fetchImpl,
  });
  const overlaps = busy.some((b) => startInstant < b.end && endInstant > b.start);
  if (overlaps) throw new ApiError(409, 'SLOT_UNAVAILABLE');

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
        // Agrupado y sin ambigüedad de país: es lo que el barbero marca.
        `Teléfono: ${phone.display}`,
        `Servicio: ${service.nombre}`,
        `Barbero: ${barber.nombre}`,
        // Solo aparece si el cliente escribió algo — nunca una línea vacía.
        ...(notes ? [`Notas: ${notes}`] : []),
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

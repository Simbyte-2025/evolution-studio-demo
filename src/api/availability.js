import { findServiceById, findBarberById, DEMO_WORKING_BLOCKS } from '../lib/fixtures/demo-config.js';
import { zonedTimeToUtc } from '../lib/time.js';
import { computeAvailableSlots } from '../lib/slots.js';
import { refreshAccessToken } from '../lib/google-oauth.js';
import { queryFreeBusy } from '../lib/calendar.js';
import { ApiError } from '../lib/errors.js';

// GET /api/availability?serviceId&barberId&date
export async function computeAvailabilityForRequest({
  serviceId,
  barberId,
  date,
  env,
  now = new Date(),
  fetchImpl = fetch,
}) {
  const service = findServiceById(serviceId);
  if (!service) throw new ApiError(400, 'SERVICE_NOT_FOUND');

  const barber = findBarberById(barberId);
  if (!barber) throw new ApiError(400, 'BARBER_NOT_FOUND');

  const calendarId = env[barber.calendarEnvKey];
  if (!calendarId) throw new ApiError(500, 'BARBER_CALENDAR_NOT_CONFIGURED');

  const timeZone = env.BUSINESS_TIMEZONE || 'America/Santiago';

  const { accessToken } = await refreshAccessToken({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    refreshToken: env.GOOGLE_REFRESH_TOKEN,
    fetchImpl,
  });

  const dayStart = zonedTimeToUtc(date, '00:00', timeZone);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60000);

  const busy = await queryFreeBusy({
    accessToken,
    calendarId,
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    fetchImpl,
  });

  const slots = computeAvailableSlots({
    date,
    timeZone,
    workingBlocks: DEMO_WORKING_BLOCKS,
    durationMin: service.duracion_min,
    busyIntervals: busy,
    now,
    minAdvanceMin: Number(env.MIN_ADVANCE_MIN || 0),
  });

  return { date, timezone: timeZone, slots };
}

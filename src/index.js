import { buildConfigResponse } from './api/config.js';
import { computeAvailabilityForRequest } from './api/availability.js';
import { createBooking } from './api/bookings.js';
import { ApiError } from './lib/errors.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(err) {
  if (err instanceof ApiError) return jsonResponse({ error: err.code }, err.status);
  return jsonResponse({ error: 'INTERNAL_ERROR' }, 500);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/config' && request.method === 'GET') {
      return jsonResponse(buildConfigResponse());
    }

    if (url.pathname === '/api/availability' && request.method === 'GET') {
      try {
        const result = await computeAvailabilityForRequest({
          serviceId: url.searchParams.get('serviceId'),
          barberId: url.searchParams.get('barberId'),
          date: url.searchParams.get('date'),
          env,
        });
        return jsonResponse(result);
      } catch (err) {
        return errorResponse(err);
      }
    }

    if (url.pathname === '/api/bookings' && request.method === 'POST') {
      try {
        const input = await request.json();
        const result = await createBooking({ input, env });
        return jsonResponse(result, 201);
      } catch (err) {
        return errorResponse(err);
      }
    }

    // Cualquier otra ruta (/, /reservar, assets estáticos) se sirve desde
    // Workers Assets — nunca desde este handler.
    return env.ASSETS.fetch(request);
  },
};

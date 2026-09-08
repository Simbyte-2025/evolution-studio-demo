import { getActiveServices, getActiveBarbers } from '../lib/fixtures/demo-config.js';

// GET /api/config — nunca expone calendarEnvKey/emailEnvKey (nombres de
// variables de entorno) ni, por supuesto, sus valores reales.
export function buildConfigResponse() {
  return {
    servicios: getActiveServices().map(({ id, nombre, descripcion, duracion_min, precio, icono }) => ({
      id,
      nombre,
      descripcion,
      duracion_min,
      precio,
      icono,
    })),
    barberos: getActiveBarbers().map(({ id, nombre, color, descripcion }) => ({
      id,
      nombre,
      color,
      descripcion,
    })),
  };
}

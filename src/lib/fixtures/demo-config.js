// Fixtures DEMO — copiados 1:1 desde reservation-prototype/index.html
// (cargarServicios()/cargarBarberos(), líneas ~1011-1093). No representan
// datos reales confirmados por Evolution Studio (ver §19 del documento de
// contexto). El calendar_id/correo de cada barbero se resuelve en runtime
// desde variables de entorno del Worker, nunca hardcodeado aquí.

export const DEMO_SERVICES = [
  { id: 3, nombre: 'Barba', descripcion: 'Perfilado y desvanecido de barba', duracion_min: 15, precio: 5000, icono: 'bi-emoji-smile', activo: true },
  { id: 9, nombre: 'Corte + Barba', descripcion: 'Corte de cabello y perfilado de barba', duracion_min: 60, precio: 15000, icono: 'bi-scissors', activo: true },
  { id: 8, nombre: 'Corte Clásico', descripcion: 'Corte de cabello estilo clásico con asesoría profesional', duracion_min: 30, precio: 10000, icono: 'bi-scissors', activo: true },
  { id: 1, nombre: 'Corte desvanecido', descripcion: 'Corte de cabello desvanecido con asesoramiento profesional', duracion_min: 60, precio: 12000, icono: 'bi-scissors', activo: true },
  { id: 2, nombre: 'Perfilado de cejas', descripcion: 'Perfilado o diseño ( corte de ceja)', duracion_min: 15, precio: 2000, icono: 'bi-emoji-smile', activo: true },
  { id: 6, nombre: 'Rulos- ondulación', descripcion: '+ corte de cabello incluido', duracion_min: 120, precio: 40000, icono: 'bi-stars', activo: true },
  { id: 5, nombre: 'Visos', descripcion: 'Iluminación en tu cabello del color deseado', duracion_min: 120, precio: 50000, icono: 'bi-brush', activo: true },
];

// Solo dos barberos quedan activos para el flujo real DEMO (cuentas Gmail y
// calendarios confirmados). Los otros tres del prototipo se conservan en el
// historial de datos pero marcados inactivos — no se exponen en /api/config.
// La asignación de qué dos nombres del prototipo quedan activos es una
// decisión de datos, no visual: se conservan Leonardo y Vicente (los dos que
// ya tenían biografía en el prototipo aprobado); Cristóbal, Erik y Matute
// quedan inactivos. `calendarEnvKey` indica en qué variable de entorno del
// Worker vive el calendar_id real (nunca hardcodeado ni expuesto al cliente).
export const DEMO_BARBERS = [
  { id: 4, nombre: 'Cristóbal', color: '#ffffff', descripcion: '', activo: false, calendarEnvKey: null },
  { id: 3, nombre: 'Erik', color: '#d19d01', descripcion: '', activo: false, calendarEnvKey: null },
  { id: 1, nombre: 'Leonardo', color: '#ff4015', descripcion: 'Barbero profesional con 4 años de experiencia en barbería', activo: true, calendarEnvKey: 'GOOGLE_CALENDAR_ID_BARBER_A' },
  { id: 5, nombre: 'Matute', color: '#76bb40', descripcion: '', activo: false, calendarEnvKey: null },
  { id: 2, nombre: 'Vicente', color: '#0056d6', descripcion: 'Barbero profesional con más de 5 años de experiencia', activo: true, calendarEnvKey: 'GOOGLE_CALENDAR_ID_BARBER_B' },
];

// Único set de horarios DEMO, igual todos los días — tal como existe hoy en
// el prototipo (DEMO_SLOTS, línea 907). No se inventan horarios por
// barbero/día distintos a los ya aprobados visualmente.
export const DEMO_WORKING_BLOCKS = [{ start: '15:00', end: '21:00' }];

export function getActiveServices() {
  return DEMO_SERVICES.filter((s) => s.activo);
}

export function getActiveBarbers() {
  return DEMO_BARBERS.filter((b) => b.activo);
}

export function findServiceById(id) {
  return DEMO_SERVICES.find((s) => s.id === Number(id) && s.activo) ?? null;
}

export function findBarberById(id) {
  return DEMO_BARBERS.find((b) => b.id === Number(id) && b.activo) ?? null;
}

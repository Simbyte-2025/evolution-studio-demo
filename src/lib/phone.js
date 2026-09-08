// Normalización de teléfonos escritos por clientes reales: espacios,
// guiones, puntos y paréntesis se descartan antes de validar, para que
// "+56 9 1234 5678", "912345678" y "9 1234-5678" sean el mismo número.
//
// Regla deliberada: solo se infiere el prefijo de país en los dos casos
// inequívocos de Chile (11 dígitos que empiezan en 56, o 9 dígitos que
// empiezan en 9, que es el formato de móvil chileno). Cualquier otro número
// se conserva tal cual se marcó — es preferible guardar un número local
// ambiguo que atribuirle un país equivocado.

const SEPARATORS = /[\s\-().]/g;
const CHILEAN_MOBILE_E164 = /^\+569(\d{4})(\d{4})$/;

const MIN_DIGITS = 8;
const MAX_DIGITS = 15; // máximo de E.164

export function normalizePhone(raw) {
  const cleaned = String(raw ?? '').replace(SEPARATORS, '');
  if (!/^\+?\d+$/.test(cleaned)) return null;

  const hasCountryPrefix = cleaned.startsWith('+');
  const digits = hasCountryPrefix ? cleaned.slice(1) : cleaned;
  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) return null;

  let e164;
  if (hasCountryPrefix) {
    e164 = `+${digits}`;
  } else if (digits.length === 11 && digits.startsWith('56')) {
    e164 = `+${digits}`;
  } else if (digits.length === 9 && digits.startsWith('9')) {
    // Móvil chileno marcado sin prefijo país — el caso más común acá.
    e164 = `+56${digits}`;
  } else if (digits.length === 9 && digits.startsWith('2')) {
    // Fijo de Santiago marcado con su código de área, sin prefijo país.
    e164 = `+56${digits}`;
  } else {
    e164 = digits;
  }

  return { e164, display: formatForHumans(e164) };
}

// Agrupamiento legible solo para móviles chilenos, que es lo que el barbero
// va a leer en el evento. Cualquier otro formato se muestra sin tocar, en
// vez de agruparlo con una convención que podría no corresponder.
function formatForHumans(e164) {
  const chileanMobile = e164.match(CHILEAN_MOBILE_E164);
  if (!chileanMobile) return e164;
  return `+56 9 ${chileanMobile[1]} ${chileanMobile[2]}`;
}

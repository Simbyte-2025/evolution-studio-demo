// Describe un fallo de una API de Google SIN incorporar el cuerpo de la
// respuesta al mensaje de la excepción.
//
// Por qué importa: el mensaje de una excepción no capturada llega a los logs
// del Worker. Los cuerpos de error de Google pueden arrastrar el recurso
// consultado (un calendar_id), descripciones libres o —si alguna vez cambian
// el formato— material que no queremos ver replicado en un log. En vez de
// confiar en que el cuerpo sea inocuo, se descarta y se conserva solo lo que
// sirve para diagnosticar: qué operación falló, con qué estado HTTP y, cuando
// existe, un código externo estrictamente normalizado.

// Un código utilizable es una sola palabra tipo `invalid_grant` o `notFound`.
// Cualquier cosa con espacios, símbolos, correos o longitud sospechosa se
// descarta: si arrastra texto libre, puede arrastrar datos.
const CODIGO_SEGURO = /^[A-Za-z][A-Za-z0-9_]{0,38}$/;

function extraerCodigoExterno(bodyText) {
  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;

  // Formato OAuth 2.0: { error: "invalid_grant", ... }
  if (typeof data.error === 'string') {
    return CODIGO_SEGURO.test(data.error) ? data.error : null;
  }

  // Formato de las APIs de Google: { error: { errors: [{ reason }] } }
  const reason = data.error?.errors?.[0]?.reason;
  if (typeof reason === 'string' && CODIGO_SEGURO.test(reason)) return reason;

  const status = data.error?.status;
  if (typeof status === 'string' && CODIGO_SEGURO.test(status)) return status;

  return null;
}

export function describeGoogleFailure(operation, status, bodyText) {
  const codigo = extraerCodigoExterno(bodyText ?? '');
  return codigo
    ? `${operation} failed: HTTP ${status} (${codigo})`
    : `${operation} failed: HTTP ${status}`;
}

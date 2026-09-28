# Handoff operativo — Evolution Studio / Propuesta 1

**Fecha del snapshot:** 28 de septiembre de 2026

**Repositorio:** `Simbyte-2025/evolution-studio-demo`

**Rama de producto:** `feat/propuesta-1-booking`

**Fase:** MVP real validado en local; preparación de la primera actualización
remota con las credenciales vigentes.

Este documento permite que otro agente retome el proyecto sin reconstruir la
historia desde conversaciones anteriores. Debe leerse antes de modificar
código, GitHub, Cloudflare o Google.

---

## 1. Resultado alcanzado

Se construyó un flujo propio de reservas para Evolution Studio:

```text
landing / reservar
        ↓
Cloudflare Worker con Static Assets
        ↓
OAuth 2.0 de escritorio
        ↓
Google Calendar freeBusy
        ↓
events.insert con invitados
        ↓
horario bloqueado en consultas posteriores
```

El flujo real fue validado de extremo a extremo **en local**:

- `/reservar/` cargó correctamente;
- `/api/config` devolvió los servicios y dos barberos DEMO;
- `/api/availability` leyó dos calendarios reales;
- una reserva enviada desde la interfaz llegó a la confirmación final;
- el evento apareció en el calendario correcto;
- el horario quedó bloqueado solo para el barbero reservado;
- el segundo calendario mantuvo ese horario disponible.

Esto prueba la viabilidad funcional del MVP. No prueba todavía que la versión
remota, una URL pública o el dominio productivo utilicen la configuración
vigente.

---

## 2. Fuentes de verdad y precedencia

Usar este orden cuando dos documentos parezcan contradecirse:

1. Código y configuración de `feat/propuesta-1-booking`.
2. Este handoff.
3. `docs/OAUTH-SETUP.md` para OAuth y carga segura de secretos.
4. `README.md` y `AGENTS.md` para operación y límites del repositorio.
5. La bitácora local para evidencia histórica detallada.
6. `docs/CONTEXTO_CLAUDE_CODE_PROPUESTA_1_EVOLUTION.md` como propuesta
   inicial, no como arquitectura operativa actual.

Notion sigue siendo la fuente oficial para decisiones comerciales aprobadas,
interacciones con el negocio, responsables y seguimiento. La existencia de
código funcional no constituye aprobación del cliente.

### Bitácora histórica

La bitácora no vive en la rama de producto. Está preservada exclusivamente en:

```text
local/bitacora-propuesta-1
772d423b82e05dd32e3a31771d92fcc697ce6853
```

No tiene upstream y no debe recibir push. Puede leerse sin cambiar de rama:

```bash
git show local/bitacora-propuesta-1:docs/BITACORA-PROPUESTA-1.md
```

---

## 3. Estado Git y GitHub verificado

Checkout local:

```text
/Users/macbookdenico/Documents/simbyte-evolution-studio-propuesta1
```

Remoto:

```text
https://github.com/Simbyte-2025/evolution-studio-demo.git
```

Snapshot verificado el 28-09-2026:

| Referencia | Hash |
| --- | --- |
| `feat/propuesta-1-booking` local | `c3ca9545dc7b6245d3208d250ab1838a677bd8d5` |
| `github/feat/propuesta-1-booking` | `c3ca9545dc7b6245d3208d250ab1838a677bd8d5` |
| `github/main` | `1a0560e791aeefb5de93f45c881d840521e3d485` |

La rama de producto está 20 commits por delante de `main` y 0 por detrás.

Estado del flujo Git:

- árbol limpio al cerrar el checkpoint;
- sin PR abierto;
- sin merge a `main`;
- sin rebase, squash ni force push;
- ramas sin protección y sin CI de GitHub configurado;
- no existe integración GitHub → Cloudflare Builds.

Commits de cierre más recientes:

```text
c3ca954  fix(calendar): rechazar errores individuales de freeBusy
76eb259  docs(project): alinear el repositorio con el MVP validado
14160d4  docs(oauth): registrar la verificación por ACL del calendario compartido
7ee2b9c  docs(cloudflare): corregir el flujo de carga de secretos en la config
```

No modificar `main` ni abrir un PR antes de validar públicamente la versión
remota actualizada.

---

## 4. Arquitectura vigente del piloto

### Frontend y pipelines

Existen dos fuentes deliberadamente separadas:

| Flujo | Fuente | Comportamiento |
| --- | --- | --- |
| Demo simulada / Sites | `reservation-prototype/index.html` | no consulta Google ni crea reservas |
| MVP real / Worker | `reservation-prototype/index.real.html` | consume `/api/*` y crea eventos reales |

`index.html` continúa alimentando la landing del pipeline de Sites. No
conectar la demo de Sites a `/api/*` sin una decisión explícita de publicación.

### Backend

El backend es un **Cloudflare Worker con Static Assets**, no Pages Functions.

Entrypoint:

```text
src/index.js
```

Endpoints:

| Método | Ruta | Función |
| --- | --- | --- |
| `GET` | `/api/config` | catálogo DEMO público, sin datos internos |
| `GET` | `/api/availability` | obtiene busy blocks y calcula slots |
| `POST` | `/api/bookings` | valida, reconsulta disponibilidad y crea evento |

Archivos principales:

```text
src/api/availability.js       disponibilidad
src/api/bookings.js           creación de reservas
src/lib/calendar.js           freeBusy, events.insert/get e idempotencia
src/lib/google-oauth.js       refresh token → access token
src/lib/google-error.js       errores sanitizados
src/lib/slots.js              cálculo puro de horarios
src/lib/time.js               America/Santiago y DST
src/lib/fixtures/demo-config.js servicios y barberos DEMO
```

### Integración Google

- OAuth 2.0 mediante cliente de escritorio.
- La autorización se ejecuta localmente con `scripts/oauth-setup.mjs`.
- No hay callback OAuth público ni botón “Conectar con Google”.
- No se usa cuenta de servicio ni delegación de Workspace.
- Google Calendar es el único registro operativo del piloto.
- Google Sheets y Email Service no están implementados.

### Idempotencia y concurrencia

- `event.id` se deriva de `idempotencyKey` mediante SHA-256/base32hex.
- El backend busca primero un evento con ese ID.
- Un reintento de la misma reserva devuelve éxito idempotente sin duplicar.
- `freeBusy` se consulta nuevamente antes del insert.
- La prevención de carreras es **best-effort**: dos solicitudes simultáneas
  con claves distintas todavía podrían superar ambas la comprobación.
- No introducir D1 ni Durable Objects antes de validar que el piloto necesita
  una garantía transaccional mayor.

---

## 5. Estado de Google y calendarios

La cuenta organizadora original, `agenda.evolution.demo@gmail.com`, fue
inhabilitada por Google y queda mencionada solo como referencia histórica. Se
migró la integración a:

```text
cannibalchild.uk@gmail.com
```

Se creó un proyecto Google Cloud independiente para el piloto, con Calendar
API, consentimiento externo, estado de publicación “Testing” y un cliente
OAuth de escritorio.

Se crearon dos calendarios nuevos bajo la cuenta organizadora:

- `DEMO — Barbero 1`;
- `DEMO — Barbero 2`.

La cuenta organizadora figura como propietaria y los dos Calendar IDs nuevos
reemplazaron los anteriores únicamente en `.dev.vars`.

### Hechos verificados

- autorización OAuth completada;
- refresh token guardado sin imprimirse;
- intercambio de refresh token exitoso durante la validación;
- ambos calendarios respondieron a disponibilidad;
- una reserva real fue creada en `DEMO — Barbero 1`;
- una consulta posterior bloqueó el slot del Barbero 1 y no el del Barbero 2.

### No asumir como vigente sin volver a comprobar

- El proyecto OAuth continuaba en “Testing”; el refresh token puede caducar
  a los 7 días. La validación exitosa de septiembre no garantiza que hoy siga
  vigente.
- La cuenta administradora veía los calendarios anteriores, pero no existe
  evidencia posterior a la migración que cierre la visibilidad de los dos
  calendarios nuevos.
- Existen eventos reales de prueba en Calendar. No eliminarlos ni crear otros
  durante un preflight sin autorización explícita.

Si la disponibilidad falla con `oauth.refresh failed: HTTP 400
(invalid_grant)`, no modificar el frontend: revalidar el estado OAuth y, si
corresponde, volver a ejecutar la autorización local siguiendo
`docs/OAUTH-SETUP.md`.

---

## 6. Corrección de `freeBusy` ya incorporada

Google puede responder HTTP 200 y reportar el fallo dentro de
`calendars[calendarId].errors`. Antes de `c3ca954`, el sistema interpretaba
ese caso como `busy: []` y ofrecía horarios falsos.

Comportamiento actual:

- una entrada con `errors` lanza `CalendarError`;
- una respuesta sin el Calendar ID solicitado lanza `CalendarError`;
- disponibilidad no devuelve slots falsos;
- reservas no alcanzan `events.insert`;
- la excepción conserva solo operación, HTTP status y un código externo
  normalizado;
- Calendar IDs, correos y mensajes libres no llegan al error público ni a
  los logs del Worker.

Tests del arreglo:

- error individual dentro de HTTP 200;
- ausencia del calendario solicitado;
- disponibilidad detenida;
- reserva detenida antes del insert.

---

## 7. Seguridad y manejo de secretos

El repositorio es público. Tratar cualquier salida de terminal, captura,
comentario o archivo versionado como material potencialmente público.

`.dev.vars`:

- existe solo en local;
- está ignorado por Git;
- no está versionado;
- tiene permisos `600`;
- contiene ocho secretos/bindings y `MIN_ADVANCE_MIN`;
- nunca debe imprimirse con `cat`, `grep`, capturas o volcados de cambios.

Secretos requeridos por el Worker, solo por nombre:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
BARBER_A_CALENDAR_ID
BARBER_B_CALENDAR_ID
BARBER_A_EMAIL
BARBER_B_EMAIL
OWNER_EMAIL
```

Reglas obligatorias:

- no pegar valores en chats o documentación;
- no copiar `.dev.vars` completo a Wrangler;
- no usar `wrangler secret put`: crea y despliega una versión por cada
  invocación;
- para una versión posterior usar un único archivo temporal externo al
  repositorio, modo `600`, con exactamente las ocho claves;
- cargar las ocho juntas mediante `wrangler versions upload --secrets-file
  <archivo-temporal> --strict`;
- borrar el temporal solo después de confirmar la versión remota;
- nunca revelar valores mediante `versions view`, logs o capturas.

Existen respaldos JSON OAuth fuera del repositorio. Por decisión del usuario
no fueron abiertos, movidos ni eliminados. Siguen siendo un pendiente de
seguridad local y no deben tocarse sin autorización.

---

## 8. Pruebas y último resultado verificado

Comandos obligatorios antes de cerrar cambios:

```bash
npm test
npm run test:node
npm run build:cloudflare
npx wrangler deploy --dry-run
git diff --check
git status --short
```

Último resultado en `c3ca954`:

| Comprobación | Resultado |
| --- | --- |
| Python | 49/49 |
| Node | 92/92 |
| Build Cloudflare | correcto; 7 assets |
| Wrangler dry-run | correcto; ningún despliegue |
| Credenciales reales en diff/build | 0 coincidencias sobre 5 valores sensibles |
| Árbol | limpio |

Los tests deben usar `fetch` simulado. Una prueba que accidentalmente llega a
Google es inválida aunque aparezca verde.

---

## 9. Estado de Cloudflare: último conocido, no asumir actual

El Worker remoto existe:

```text
evolution-studio-booking
```

Último snapshot registrado antes de este handoff:

| Campo | Último valor conocido |
| --- | --- |
| Versión | `3da242e4-6119-49be-8ff0-42b76238968b` |
| Deployment | `31461ea7-54ca-4a03-ba3b-558acff14a1e` |
| `workers.dev enabled` | `false` |
| `previews_enabled` | `false` |
| Rutas personalizadas | 0 |
| Custom domains | 0 |
| Cron triggers | 0 |
| Workers Builds / integración Git | 0 |

La URL versionada de preview devolvió `404` con código Cloudflare `1042` en
la última comprobación. Eso fue una evidencia histórica, no una autorización
para asumir que el estado no cambió.

La versión remota conocida conserva el conjunto anterior de credenciales y
Calendar IDs. El código nuevo está en GitHub, pero un push no actualiza el
Worker porque no existe integración Git/Cloudflare.

Antes de cualquier escritura, releer en modo read-only:

```bash
npx wrangler whoami --json
npx wrangler versions list --json
npx wrangler deployments list --json
npx wrangler versions view <VERSION-ID> --json
```

Además, consultar por API/MCP el recurso subdomain del script y verificar
literalmente:

```text
enabled = false
previews_enabled = false
```

También confirmar:

- cero rutas de Worker relevantes;
- cero custom domains;
- DNS y Sites intactos;
- ausencia de builds automáticos;
- cuenta Cloudflare correcta.

Si aparece cualquier diferencia, detenerse y reportarla antes del upload.

---

## 10. Próximo checkpoint recomendado

El siguiente trabajo no es rediseñar el producto. Es actualizar de forma
controlada el Worker ya existente y probarlo públicamente.

### Fase A — solo lectura

1. Confirmar checkout, rama, hash y árbol limpio.
2. Confirmar sesión de Wrangler y cuenta correcta.
3. Releer versiones, deployment, bindings e ingreso público.
4. Confirmar que GitHub sigue en el hash esperado.
5. Reportar cualquier deriva y detenerse si existe.

### Fase B — nueva versión aislada

Solo con autorización explícita:

1. derivar fuera del repositorio un archivo temporal con las ocho claves;
2. verificar solo nombres, cantidad y permisos, nunca valores;
3. ejecutar:

   ```bash
   npm run build:cloudflare
   npx wrangler versions upload --secrets-file <archivo-temporal> --strict
   ```

4. inspeccionar la nueva versión por ID;
5. confirmar ocho secretos por nombre, bindings públicos y ausencia de
   ingreso;
6. eliminar el archivo temporal cuando el estado remoto esté confirmado.

Aunque cambiaron cinco valores —Client ID, Client Secret, refresh token y dos
Calendar IDs— deben cargarse nuevamente los ocho secretos juntos.

### Fase C — activación

Solo con una autorización independiente:

```bash
npx wrangler versions deploy <VERSION-ID>
```

Desplegar una versión no abre por sí solo acceso público mientras
`workers_dev`, Preview URLs, rutas y dominios continúen deshabilitados.

### Fase D — URL pública de prueba

Requiere otra decisión explícita. Habilitar una única entrada de prueba,
verificar el flujo completo fuera de localhost y recién después decidir:

- PR y merge a `main`;
- dominio definitivo;
- conexión con la landing publicada;
- retiro o conservación de Sites.

---

## 11. Preflight para una demo local

No crear una reserva durante el preflight.

```bash
pwd
git status --short --branch
git rev-parse HEAD
stat -f '%Sp' .dev.vars
npm run build:cloudflare
```

Usar el puerto `8799`. Si `8787` está ocupado por un proceso ajeno, no
detenerlo.

```bash
npx wrangler dev --local --ip 127.0.0.1 --port 8799
```

Comprobar, sin imprimir cuerpos sensibles:

- `GET /api/config` → 200;
- `/reservar/` → 200;
- disponibilidad de Barbero 1 → 200 y slots;
- disponibilidad de Barbero 2 → 200 y slots.

`127.0.0.1` solo es accesible desde el mismo Mac. Conectarse al hotspot del
iPhone entrega Internet al Mac, pero no publica el sitio en el teléfono ni en
otro equipo.

Una reserva real debe ser iniciada explícitamente por el usuario porque crea
un evento persistente y puede enviar invitaciones.

---

## 12. Límites aceptados del piloto

- Servicios, precios, barberos y horarios son DEMO y no están aprobados por
  el dueño.
- Solo dos barberos están activos en el flujo real.
- `MIN_ADVANCE_MIN=0` sirve únicamente para la demostración.
- La concurrencia es best-effort, no transaccional.
- El proyecto OAuth en Testing puede exigir reautorización periódica.
- No hay dashboard, base de datos, Sheets, WhatsApp, pagos ni login.
- La propiedad productiva definitiva debe migrar a recursos controlados por
  el cliente antes de considerar la solución entregada.
- La reunión con el dueño quedó registrada como postergada para la tarde del
  miércoles 9 de septiembre de 2026; no existe evidencia de que posteriormente
  se haya realizado ni de aprobación comercial.
- La decisión de integrar o reemplazar Vortexa no está cerrada con el cliente.

---

## 13. Acciones prohibidas sin autorización específica

- imprimir o copiar valores de `.dev.vars`;
- abrir o borrar respaldos OAuth locales;
- ejecutar `wrangler secret put`;
- subir o desplegar una versión de Cloudflare;
- habilitar workers.dev, Preview URLs, rutas o dominios;
- tocar DNS o Sites;
- eliminar eventos reales de Calendar;
- crear reservas de prueba adicionales;
- hacer push de `local/bitacora-propuesta-1`;
- hacer force push, merge a `main` o abrir PR;
- presentar el MVP como aceptado por el cliente;
- expandir el alcance con Sheets, Email Service, D1 o Durable Objects sin una
  necesidad validada y una nueva decisión.

---

## 14. Criterio de terminado de la próxima fase

La siguiente fase se considera cerrada solo cuando exista evidencia de que:

1. la nueva versión remota contiene el código de `c3ca954` o posterior;
2. los ocho secretos aparecen por nombre y sin valores;
3. las cinco sustituciones vigentes fueron cargadas conjuntamente;
4. la versión fue inspeccionada antes de activarse;
5. la URL pública elegida sirve el frontend y los tres endpoints;
6. ambos calendarios devuelven disponibilidad real;
7. una reserva autorizada aparece en el calendario correcto;
8. el horario queda bloqueado solo para ese barbero;
9. no hubo cambios accidentales en Sites, DNS, `main` o el dominio;
10. el resultado queda registrado en la bitácora local y, si corresponde, en
    la fuente oficial de seguimiento comercial.

Hasta cumplir esos diez puntos, describir el sistema como **MVP validado en
local**, no como producción ni como solución aceptada por el negocio.

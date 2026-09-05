# Contexto técnico para Claude Code — Propuesta 1 Evolution Studio

**Fecha de consolidación:** 4 de septiembre de 2026  
**Proyecto:** Simbyte — Evolution Studio  
**Tipo de solución:** MVP funcional comercial, versión económica  
**Estado de la arquitectura:** decisión aprobada para la Propuesta 1

> **Corrección aplicada — 4 de septiembre de 2026 (tarde):** la sección 2 de la versión original de este documento reintroducía un dato ya corregido por la entrevista de descubrimiento del 31-08-2026 ("la información llega al WhatsApp del negocio"). Se corrige aquí para alinear este documento con el informe consolidado de Notion. Ninguna otra decisión arquitectónica de este documento fue modificada.

---

## 1. Propósito de este documento

Este archivo es el contexto técnico y funcional que debe utilizar Claude Code antes de analizar o modificar el repositorio de Evolution Studio.

La prioridad no es construir un sistema de agendamiento general de Simbyte ni una plataforma SaaS. La prioridad es implementar la solución funcional más pequeña que resuelva el dolor inmediato de Evolution Studio:

> El cliente reserva desde la landing y la cita aparece automáticamente en la agenda del negocio, queda registrada en una planilla y el dueño recibe una notificación.

La mejora central frente al flujo actual con Vortexa es esa: que la reserva quede registrada en Google Calendar y que el dueño reciba una notificación inmediata, sin depender de revisar manualmente la plataforma.

Esta primera propuesta debe ser simple, de bajo costo operativo, vendible y funcional. Las ampliaciones se evaluarán después de probarla.

---

## 2. Contexto comercial conocido

### Hechos proporcionados por Nicolás

- Evolution Studio es una barbería ubicada en Quinta de Tilcoco, Chile.
- Actualmente utiliza Vortexa como sistema de reservas.
- El costo informado de Vortexa es aproximadamente **CLP 35.000 mensuales**.
- Vortexa no notifica las nuevas reservas al negocio; la reserva queda registrada en la página, no en el WhatsApp del negocio.
- Evolution debe ingresar manualmente a la plataforma de Vortexa para descubrir cada nueva reserva, y buscar ahí los datos del cliente cuando necesita continuar la gestión por WhatsApp, Instagram u otro canal externo.
- El dueño indicó que el sistema actual no le genera más clientes ni resuelve claramente sus problemas operativos.
- Ya existe una landing/demostración de Evolution con identidad visual negra y dorada.
- La solución comercial debe incluir un dominio `.cl` propio durante un año.
- `evolutionbarber.cl` es un nombre ilustrativo; no asumir que está registrado o aprobado.

### Objetivo comercial de la Propuesta 1

Ofrecer una alternativa más simple y potencialmente más económica que el sistema actual:

1. landing personalizada;
2. selección de servicio;
3. selección de barbero;
4. consulta de horas disponibles;
5. reserva;
6. registro automático en Google Calendar;
7. registro en Google Sheets;
8. notificación al dueño.

No agregar características solo porque podrían ser útiles en el futuro.

---

## 3. Decisión técnica cerrada

### Stack aprobado para la Propuesta 1

- **Frontend y landing:** HTML/CSS/JavaScript existentes o el framework que ya use el repositorio.
- **Hosting:** Cloudflare Pages, plan gratuito.
- **Backend mínimo:** Cloudflare Pages Functions, ejecutándose como Workers.
- **Persistencia mínima:** Google Sheets.
- **Disponibilidad y agenda operativa:** Google Calendar.
- **Integración con Google:** Google Calendar API + Google Sheets API.
- **Autenticación servidor a servidor:** cuenta de servicio de Google.
- **Notificación inmediata al dueño:** Cloudflare Email Service hacia una dirección verificada.
- **Zona horaria comercial:** `America/Santiago`.

### Tecnologías expresamente fuera de esta propuesta

No introducir:

- PostgreSQL;
- Firebase o Firestore;
- Cloudflare D1;
- Apps Script;
- n8n;
- VPS;
- Redis;
- colas;
- dashboard administrativo;
- CRM;
- autenticación de barberos o administrador;
- aplicación móvil;
- WhatsApp API;
- pagos en línea;
- analítica avanzada.

Si durante la implementación aparece una limitación real que hace imprescindible cambiar esta lista, documentarla con evidencia antes de proponer el cambio. No cambiar la arquitectura por anticipación.

---

## 4. Arquitectura funcional

```text
Cliente
  ↓
Landing de Evolution en Cloudflare Pages
  ↓
Pages Functions
  ├── lee configuración desde Google Sheets
  ├── consulta bloques ocupados en Google Calendar
  ├── calcula horas ofrecibles
  ├── registra la reserva en Google Sheets
  ├── crea el evento en Google Calendar
  └── notifica al dueño mediante Cloudflare Email Service
```

### Responsabilidades por componente

#### Cloudflare Pages

- servir la landing;
- mantener la experiencia móvil;
- mostrar el flujo de reserva;
- usar el dominio `.cl` del cliente;
- realizar llamadas same-origin a `/api/*`.

#### Cloudflare Pages Functions

- mantener las credenciales fuera del navegador;
- validar todas las entradas;
- obtener servicios, profesionales y horarios;
- calcular disponibilidad;
- volver a validar el horario al confirmar;
- registrar la reserva;
- crear el evento;
- emitir la notificación;
- devolver respuestas claras al frontend.

#### Google Sheets

- almacenar configuración editable;
- mantener un registro tabular de reservas;
- permitir al dueño consultar los datos desde su cuenta Google;
- servir como persistencia mínima, no como CRM.

#### Google Calendar

- representar ocupaciones reales;
- mostrar las citas al dueño y a cada barbero;
- impedir que un bloque ya ocupado vuelva a mostrarse como disponible;
- funcionar como agenda operativa diaria.

#### Cloudflare Email Service

- enviar un aviso inmediato únicamente al correo verificado del dueño;
- no enviar correos arbitrarios a clientes dentro de esta versión gratuita.

---

## 5. Modelo operativo de calendarios

La cuenta Google del cliente debe crear y conservar la propiedad de los calendarios. No crear los calendarios con la cuenta de servicio.

Modelo previsto:

```text
Evolution — Barbero 1
Evolution — Barbero 2
Evolution — Barbero 3
```

Cada profesional tendrá su propio `calendar_id`.

Motivo:

- una ocupación del Barbero 1 no debe bloquear al Barbero 2;
- el dueño puede visualizar todos los calendarios conjuntamente;
- cada barbero puede recibir acceso solo a su calendario;
- no hace falta un dashboard adicional.

La cuenta de servicio tendrá permiso de lectura y escritura únicamente sobre los calendarios necesarios.

### Restricción relevante

En este MVP no usar asistentes o invitados de Calendar como mecanismo principal de notificación. Las cuentas de servicio necesitan delegación de dominio para determinadas operaciones con asistentes, lo que no debe asumirse para una cuenta Google personal o un negocio sin Google Workspace administrado.

Los barberos accederán a los calendarios compartidos. El dueño recibirá el aviso inmediato mediante Cloudflare Email Service.

---

## 6. Estructura mínima de Google Sheets

Crear o utilizar una planilla propiedad de la cuenta Google del cliente. Compartirla con la cuenta de servicio con permisos mínimos suficientes.

### Hoja `Servicios`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador estable, por ejemplo `corte` |
| `nombre` | string | Nombre visible |
| `duracion_min` | integer | Duración total del servicio |
| `precio_clp` | integer/opcional | Precio mostrado si corresponde |
| `activo` | boolean | Control de publicación |

### Hoja `Barberos`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador estable |
| `nombre` | string | Nombre visible |
| `calendar_id` | string | Calendar de ese profesional |
| `activo` | boolean | Control de publicación |

### Hoja `Horarios`

| Columna | Tipo | Descripción |
|---|---|---|
| `barbero_id` | string | Relación con `Barberos.id` |
| `dia_semana` | integer/string | Día aplicable |
| `inicio` | hora local | Inicio de jornada o tramo |
| `fin` | hora local | Fin de jornada o tramo |
| `activo` | boolean | Habilitación del tramo |

Debe permitirse más de un tramo por día, por ejemplo `09:00–13:00` y `14:00–19:00`, sin crear todavía una lógica especial para descansos.

### Hoja `Reservas`

| Columna | Tipo | Descripción |
|---|---|---|
| `booking_id` | string | Identificador generado por el backend |
| `created_at` | RFC 3339 | Momento de creación |
| `cliente_nombre` | string | Nombre del cliente |
| `cliente_telefono` | string | Teléfono normalizado |
| `servicio_id` | string | Servicio reservado |
| `servicio_nombre` | string | Copia legible del nombre |
| `barbero_id` | string | Profesional reservado |
| `barbero_nombre` | string | Copia legible del nombre |
| `inicio` | RFC 3339 | Inicio con zona/offset correcto |
| `fin` | RFC 3339 | Término |
| `estado` | enum | `PENDING`, `CONFIRMED` o `FAILED` |
| `calendar_event_id` | string | ID devuelto por Calendar |
| `origen` | string | `evolution-landing` |

No almacenar en esta etapa perfiles completos, historial CRM, notas de marketing ni datos innecesarios.

---

## 7. Endpoints mínimos

La estructura exacta puede adaptarse al framework existente, pero el comportamiento debe equivaler a lo siguiente.

### `GET /api/config`

Entrega al frontend:

- servicios activos;
- barberos activos;
- información pública necesaria para construir el formulario.

No exponer:

- `calendar_id`;
- spreadsheet ID;
- secretos;
- direcciones administrativas;
- información interna.

### `GET /api/availability`

Parámetros esperados:

```text
serviceId
barberId
date=YYYY-MM-DD
```

Comportamiento:

1. validar que servicio y barbero existan y estén activos;
2. leer duración y horario laboral desde Sheets;
3. consultar `freeBusy` del Calendar correspondiente;
4. generar candidatos dentro del horario laboral;
5. eliminar cualquier candidato que se superponga con un bloque ocupado;
6. eliminar horas pasadas o que no cumplan la anticipación mínima configurada;
7. devolver slots locales legibles y un valor temporal inequívoco para reservar.

Ejemplo conceptual:

```json
{
  "date": "2026-09-08",
  "timezone": "America/Santiago",
  "slots": [
    {"label": "10:00", "start": "2026-09-08T10:00:00-03:00"},
    {"label": "10:45", "start": "2026-09-08T10:45:00-03:00"}
  ]
}
```

### `POST /api/bookings`

Entrada mínima:

```json
{
  "serviceId": "corte",
  "barberId": "barbero-1",
  "start": "2026-09-08T10:00:00-03:00",
  "name": "Juan Pérez",
  "phone": "+56912345678",
  "idempotencyKey": "uuid-generado-por-el-cliente"
}
```

Secuencia:

1. validar formato, longitud y campos permitidos;
2. resolver servicio, duración, profesional y calendario desde el servidor;
3. no confiar en precio, duración, nombre del servicio ni `calendar_id` enviados por el navegador;
4. revisar si ya existe la misma `idempotencyKey` o reserva;
5. consultar nuevamente `freeBusy` inmediatamente antes de confirmar;
6. si está ocupado, responder `409 SLOT_UNAVAILABLE`;
7. agregar en Sheets una fila `PENDING`;
8. crear el evento en Google Calendar;
9. actualizar la fila como `CONFIRMED` e incorporar `calendar_event_id`;
10. enviar el aviso al dueño sin invalidar una reserva ya creada si el correo falla;
11. devolver `201` con código de reserva y resumen.

Si falla Calendar después de crear la fila, actualizarla a `FAILED` y no confirmar al cliente.

---

## 8. Evento de Google Calendar

Formato sugerido:

```text
Título: Corte — Juan Pérez

Descripción:
Reserva: EV-XXXXXXXX
Cliente: Juan Pérez
Teléfono: +56912345678
Servicio: Corte
Barbero: Barbero 1
Origen: evolution-landing
```

Requisitos:

- el evento debe ser `opaque/busy`;
- usar `America/Santiago` o valores RFC 3339 correctos;
- no usar un offset fijo para Chile porque existe cambio estacional;
- conservar el `event_id` en Sheets;
- los detalles no deben exponerse en calendarios públicos.

---

## 9. Notificación al dueño

Enviar después de confirmar Calendar:

```text
Asunto: Nueva reserva — Evolution Studio

Cliente: Juan Pérez
Teléfono: +56 9 1234 5678
Servicio: Corte
Barbero: Barbero 1
Fecha: 8 de septiembre de 2026
Hora: 10:00
Reserva: EV-XXXXXXXX
```

La dirección del dueño debe configurarse como destino verificado en Cloudflare.

En el plan gratuito, no asumir envío a cualquier correo de cliente. El cliente recibe confirmación en pantalla. La confirmación por correo, WhatsApp o SMS pertenece a una propuesta posterior.

---

## 10. Seguridad mínima obligatoria

- Mantener las credenciales Google en secretos de Cloudflare, nunca en el repositorio ni en JavaScript público.
- Usar una cuenta de servicio específica para este cliente.
- Otorgar acceso solo a la planilla y calendarios correspondientes.
- Validar todos los datos en el servidor.
- Usar llamadas same-origin desde la landing.
- No aceptar IDs de calendario, duración o precio suministrados como autoridad por el navegador.
- Normalizar y limitar nombre y teléfono.
- No incluir teléfonos completos en logs generales.
- Añadir protección básica contra doble envío y automatizaciones abusivas: idempotencia, honeypot y límites razonables por solicitud.
- No crear un sistema de login porque no existe dashboard en esta propuesta.

### Secretos/configuración esperada

Nombres orientativos, adaptables al proyecto:

```text
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_SHEET_ID
GOOGLE_CALENDAR_SCOPE
OWNER_NOTIFICATION_EMAIL
EMAIL_FROM
BUSINESS_TIMEZONE=America/Santiago
```

No copiar valores reales a archivos `.env` versionados.

---

## 11. Concurrencia y limitación aceptada

El control mínimo aprobado para esta etapa es:

```text
mostrar disponibilidad
→ cliente elige
→ volver a consultar Calendar
→ si sigue libre, crear reserva
```

Google Sheets y Google Calendar no participan en una transacción atómica conjunta. Existe una ventana residual si dos personas confirman exactamente el mismo profesional y horario al mismo tiempo.

Para este piloto de bajo volumen, esa limitación está aceptada conscientemente. No incorporar PostgreSQL, Firestore, D1, Durable Objects ni otra infraestructura para resolverla sin evidencia de que el piloto lo necesita.

Sí implementar:

- revalidación inmediatamente antes de confirmar;
- clave de idempotencia;
- prevención de dobles clics en el frontend;
- manejo explícito de `409 SLOT_UNAVAILABLE`.

---

## 12. Experiencia mínima del cliente

Flujo visible:

```text
1. Seleccionar servicio
2. Seleccionar barbero
3. Seleccionar fecha
4. Seleccionar hora disponible
5. Ingresar nombre y teléfono
6. Confirmar
7. Ver comprobante de reserva
```

Estados necesarios:

- cargando configuración;
- cargando disponibilidad;
- sin horas disponibles;
- enviando reserva;
- horario ocupado durante la confirmación;
- reserva confirmada;
- error recuperable.

La interfaz debe ser móvil primero y mantener la identidad visual existente de Evolution. No rediseñar toda la landing si el flujo puede integrarse en la estructura actual.

---

## 13. Alcance excluido

No implementar en la Propuesta 1:

- dashboard `/admin`;
- login;
- perfiles o roles;
- CRM;
- historial del cliente;
- campañas;
- cookies de marketing;
- pagos o abonos;
- WhatsApp automático;
- correo automático al cliente;
- cancelación o reprogramación autoservicio;
- recordatorios múltiples;
- lista de espera;
- caja, inventario o facturación;
- estadísticas avanzadas;
- multi-sucursal;
- sincronización con Notion;
- panel propio de calendario.

La consulta operativa se realiza en Google Calendar y, si se necesita detalle tabular, en Google Sheets.

---

## 14. Propiedad y aislamiento

Esta instalación corresponde únicamente a Evolution Studio.

Idealmente, deben pertenecer al cliente:

- dominio `.cl`;
- cuenta y zona de Cloudflare;
- proyecto Pages;
- cuenta/proyecto Google Cloud;
- cuenta de servicio;
- Google Sheets;
- calendarios.

Durante la etapa de desarrollo y prueba es aceptable utilizar temporalmente cuentas, proyectos o calendarios de Simbyte para construir y validar el flujo técnico, siempre que los datos permanezcan aislados y no se mezclen con otros clientes. Esa fase de prueba no sustituye el requisito de propiedad: el despliegue productivo definitivo debe migrar a los recursos del cliente antes de considerarse entregado.

Simbyte conserva acceso administrativo según el acuerdo comercial y mantiene el código y soporte conforme al contrato. No usar recursos personales de Nicolás como dependencia permanente del producto entregado en producción.

No mezclar datos ni credenciales con otros clientes de Simbyte.

---

## 15. Costos técnicos considerados

### Hechos verificados al 4 de septiembre de 2026

- Las solicitudes a archivos estáticos de Cloudflare Pages son gratuitas e ilimitadas en planes Free y Paid.
- Pages Functions consume la cuota de Workers Free.
- Workers Free publica un límite de 100.000 solicitudes diarias y 10 ms de CPU por invocación.
- Google Calendar `freeBusy.query` devuelve bloques ocupados; el cálculo de slots debe hacerlo el backend.
- Google Calendar `events.insert` permite crear eventos autorizados.
- Google Sheets `spreadsheets.values.append` permite anexar filas a una tabla.
- Cloudflare Email Service permite enviar gratis a direcciones de destino verificadas. El envío a destinatarios arbitrarios requiere Workers Paid.

### Inferencia razonable

El tráfico de una barbería local debería quedar muy por debajo del límite diario de solicitudes. Esto debe comprobarse con métricas reales después de desplegar.

### Costos externos no definidos aquí

- registro anual del dominio `.cl`;
- trabajo de diseño y desarrollo de Simbyte;
- configuración inicial;
- soporte y mantención;
- eventuales costos futuros si se superan cuotas o se agregan servicios.

---

## 16. Criterios de aceptación

La Propuesta 1 estará técnicamente terminada cuando se demuestre lo siguiente:

1. La landing carga correctamente en móvil desde Cloudflare Pages.
2. Servicios y barberos activos se obtienen desde Sheets.
3. Los horarios laborales se interpretan con `America/Santiago`.
4. Un evento ocupado en Calendar elimina los slots incompatibles.
5. Una reserva válida crea exactamente un evento operativo.
6. La reserva queda registrada en Sheets con su `calendar_event_id`.
7. El horario reservado deja de mostrarse posteriormente.
8. El dueño recibe el aviso en su dirección verificada.
9. Un doble clic no genera dos reservas con la misma idempotency key.
10. Si el horario se ocupa antes de confirmar, el cliente recibe una respuesta comprensible y puede elegir otro.
11. Ninguna credencial aparece en frontend, repositorio o logs públicos.
12. Los datos y recursos están aislados de otros clientes.

---

## 17. Pruebas mínimas

### Disponibilidad

- calendario vacío;
- evento manual que bloquea parcialmente el día;
- evento que cubre exactamente un slot;
- servicio que no cabe antes del cierre;
- día sin horario configurado;
- horario pasado;
- cambio de hora en Chile.

### Reserva

- reserva válida;
- servicio inexistente;
- barbero inactivo;
- teléfono inválido;
- slot ocupado entre consulta y confirmación;
- doble clic/misma idempotency key;
- falla de Sheets;
- falla de Calendar;
- falla de notificación después de crear la reserva.

### Seguridad

- manipulación de duración en navegador;
- manipulación de `calendar_id`;
- campos excesivamente largos;
- envío automatizado al honeypot;
- confirmación de que los secretos no aparecen en el bundle.

---

## 18. Primera tarea para Claude Code

Antes de escribir código:

1. inspeccionar el repositorio completo disponible;
2. identificar el stack real de la landing y su estructura;
3. verificar si ya existe configuración de Cloudflare Pages/Functions;
4. revisar `package.json`, archivos de configuración, rutas, variables y estado Git;
5. localizar el flujo actual de Vortexa o el CTA de reserva;
6. no eliminar ni sobrescribir trabajo existente;
7. entregar un informe breve con:
   - estado actual;
   - archivos que habría que modificar o crear;
   - discrepancias con este documento;
   - credenciales y datos aún faltantes;
   - plan de implementación por etapas;
   - pruebas previstas.

No implementar todavía funcionalidades fuera del alcance. No sustituir el stack aprobado por preferencias personales o por una arquitectura más escalable.

---

## 19. Datos que no deben inventarse

Claude Code debe tratar los siguientes datos como pendientes hasta que estén disponibles:

- dominio definitivo;
- repositorio y rama definitivos;
- nombres reales de barberos;
- servicios reales;
- precios;
- duración real de cada servicio;
- horarios laborales;
- anticipación mínima;
- buffers entre citas;
- correo de notificación;
- ID de planilla;
- IDs de calendarios;
- credenciales Google;
- cuenta Cloudflare definitiva;
- textos finales de confirmación y política de datos.

Para avanzar técnicamente sin esos datos se pueden utilizar fixtures claramente marcados como `DEMO`, pero no presentarlos como información real del cliente.

---

## 20. Fuentes oficiales verificadas

- Cloudflare Pages Functions: https://developers.cloudflare.com/pages/functions/
- Precios y límites de Pages Functions: https://developers.cloudflare.com/pages/functions/pricing/
- Precios y límites de Workers: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare Email Service, precios: https://developers.cloudflare.com/email-service/platform/pricing/
- Cloudflare Email Service, límites: https://developers.cloudflare.com/email-service/platform/limits/
- OAuth 2.0 servidor a servidor de Google: https://developers.google.com/identity/protocols/oauth2/service-account
- Google Calendar FreeBusy: https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query
- Google Calendar Events Insert: https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
- Google Sheets Values Append: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append

---

## Directriz final

Implementar primero la solución mínima que permita comprobar:

```text
Landing
→ disponibilidad real
→ reserva
→ Google Calendar
→ Google Sheets
→ aviso al dueño
```

No convertir esta propuesta en el sistema general de agendamiento de Simbyte. El aprendizaje del piloto determinará si corresponde ofrecer posteriormente CRM, panel administrativo, WhatsApp, pagos u otra infraestructura.

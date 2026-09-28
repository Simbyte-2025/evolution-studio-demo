# Simbyte — Evolution Studio

Repositorio de la demo comercial mobile-first y del MVP de reservas de
**Evolution Studio**. Los datos de servicios, precios, barberos y horarios
siguen siendo fixtures DEMO hasta que el negocio los confirme.

Para retomar el trabajo desde otro agente o sesión, leer primero
[`docs/HANDOFF-PROPUESTA-1.md`](docs/HANDOFF-PROPUESTA-1.md).

## Dos flujos separados

El repositorio conserva dos pipelines deliberadamente independientes:

1. **Demo simulada para Sites.** `index.html` y
   `reservation-prototype/index.html` generan el sitio visual publicado. No
   consultan Google ni crean reservas reales.
2. **MVP real para Cloudflare.** `reservation-prototype/index.real.html`
   alimenta un Worker con Static Assets. `/reservar/` consume `/api/config`,
   `/api/availability` y `/api/bookings`, y registra citas reales en Google
   Calendar.

No conectar el pipeline de Sites a `/api/*`: Sites y el Worker son
publicaciones distintas y se habilitan por separado.

## Ejecutar la demo simulada

```bash
python3 -m http.server 4173
```

Abrir:

```text
http://localhost:4173/
http://localhost:4173/reservation-prototype/
```

## Ejecutar el MVP real en local

Requiere dependencias instaladas y un `.dev.vars` local configurado según
`docs/OAUTH-SETUP.md`. El archivo contiene secretos: está ignorado por Git y
nunca debe imprimirse ni versionarse.

```bash
npm install
npm run build:cloudflare
npx wrangler dev --local --ip 127.0.0.1 --port 8799
```

Abrir `http://127.0.0.1:8799/reservar/`. El flujo usa Google Calendar real;
enviar el formulario crea un evento y puede enviar invitaciones.

## Validación

```bash
npm test
npm run test:node
npm run build:cloudflare
npx wrangler deploy --dry-run
```

La validación automatizada no debe realizar llamadas reales a Google.

## Arquitectura actual del piloto

- Cloudflare Worker con Static Assets; no Pages Functions.
- OAuth 2.0 de escritorio ejecutado localmente; no cuenta de servicio.
- Google Calendar como registro operativo del piloto; no Google Sheets.
- Disponibilidad mediante `freeBusy` y creación mediante `events.insert`.
- Secretos únicamente en `.dev.vars` local y bindings secretos de
  Cloudflare.
- Sin dashboard, login, CRM, WhatsApp API, pagos ni Email Service.

## Estado de publicación

La reserva real fue validada de extremo a extremo en local. Esa validación
no prueba que el Worker remoto o el dominio público usen las credenciales y
Calendar IDs vigentes. La actualización de Cloudflare y la apertura de una
URL pública pertenecen a un checkpoint posterior e independiente.

## Estructura relevante

- `index.html`: landing y fuente del pipeline de Sites.
- `reservation-prototype/index.html`: reserva simulada.
- `reservation-prototype/index.real.html`: reserva conectada al Worker.
- `src/`: API y lógica del Worker.
- `scripts/build-cloudflare.mjs`: genera `public/`, que no se versiona.
- `docs/OAUTH-SETUP.md`: configuración local y procedimiento de secretos.
- `reference/original-export/`: respaldo original; no modificar.

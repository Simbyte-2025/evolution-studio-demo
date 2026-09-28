# AGENTS.md — Evolution Studio / Simbyte

## Primer paso obligatorio

Antes de analizar o modificar este repositorio, leer
`docs/HANDOFF-PROPUESTA-1.md`. Ese documento contiene el checkpoint vigente,
los estados que deben revalidarse y las acciones que requieren autorización.

## Objetivo

Mantener la demo comercial mobile-first y el MVP real de la **Propuesta 1**:
un flujo propio que consulta disponibilidad y crea citas en Google Calendar.
La viabilidad básica ya fue validada en local; eso no equivale a publicación
remota ni aprobación comercial del negocio.

## Enfoque técnico vigente

- Mantener HTML/CSS/JS sin migrar a otro framework salvo necesidad
  demostrable y aprobada.
- El backend vigente es un **Cloudflare Worker con Static Assets** definido en
  `wrangler.jsonc`; no Pages Functions.
- La integración usa OAuth 2.0 de escritorio con una cuenta Gmail
  organizadora; no cuenta de servicio ni delegación de Workspace.
- Google Calendar es el único registro operativo del piloto. Google Sheets,
  Email Service, dashboard, login, CRM, WhatsApp API y pagos están fuera de
  este MVP hasta una nueva decisión.
- `index.html` y `reservation-prototype/index.html` pertenecen al pipeline
  simulado de Sites. `reservation-prototype/index.real.html` pertenece al
  Worker real. No cruzar sus fuentes ni conectar Sites a `/api/*`.
- Los secretos viven únicamente en `.dev.vars` y en bindings secretos de
  Cloudflare. Nunca en el repositorio, frontend, documentación o logs.
- `reference/original-export/` es respaldo: no modificarlo.
- `docs/CONTEXTO_CLAUDE_CODE_PROPUESTA_1_EVOLUTION.md` conserva el diseño
  inicial como antecedente; sus componentes no implementados no son una
  instrucción para ampliar el MVP.

## Hechos confirmados por material entregado

- Marca visible: Evolution Studio.
- Instagram: `@evolution_barbercut`.
- Ubicación indicada: Quinta de Tilcoco.
- Dirección visible: Avenida Argomedo 1591, Local C.
- Sistema externo en uso por el negocio: Vortexa (`https://vortexa.cl/saas/evolution/gestion_horas/reservar`). No notifica nuevas reservas al negocio; el equipo debe revisarlo manualmente (evidencia: entrevista de descubrimiento 31-08-2026, ver `docs/CONTEXTO_CLAUDE_CODE_PROPUESTA_1_EVOLUTION.md`).
- Identidad visual observada: fondo negro y logotipo/acento dorado.

## Contenido no validado

El export actual contiene textos de servicios, promociones, reseñas de ejemplo, horarios y otras afirmaciones que no fueron confirmadas por el cliente. No presentarlas como hechos. Si una sección depende de información no validada, ocultarla, neutralizarla o dejarla explícitamente como muestra hasta contar con evidencia. Los mismos datos de servicios, barberos y horarios usados por el backend de la Propuesta 1 deben tratarse como fixtures `DEMO` mientras no exista información real del cliente (ver §19 del documento de contexto).

## Reglas de producto

- Prioridad: móvil primero. Revisar 375, 390, 430 y 768 px.
- CTA principal: `Reservar hora` hacia `/reservar`, flujo propio de Evolution Studio (Propuesta 1). Ya no redirige a Vortexa.
- El usuario debe entender qué es Evolution y poder reservar con poca fricción.
- Logo real antes que una recreación tipográfica si la calidad disponible lo permite.
- Las imágenes deben reforzar local, trabajo o equipo; evitar decoración genérica que parezca inventada.
- No presentar Simbyte como agencia web genérica.
- La decisión comercial de integrar o reemplazar Vortexa no está cerrada con el cliente (ver `docs/CONTEXTO_CLAUDE_CODE_PROPUESTA_1_EVOLUTION.md`); el trabajo técnico de esta rama no debe presentarse frente al cliente como una migración ya acordada.
- No expandir alcance durante esta etapa más allá de lo definido en la Propuesta 1.

## Validación

Demo simulada:

```bash
python3 -m http.server 4173
```

MVP real:

```bash
npm run build:cloudflare
npx wrangler dev --local --ip 127.0.0.1 --port 8799
```

Antes de cerrar cambios:

1. comprobar que la página carga sin errores visibles;
2. revisar 375, 390, 430 y 768 px;
3. comprobar que el CTA de reserva usa `/reservar` como flujo propio, sin apuntar a Vortexa;
4. comprobar que Instagram conserva `@evolution_barbercut`;
5. confirmar que no aparezcan datos no verificados como si fueran reales;
6. ejecutar `npm test` y `npm run test:node`;
7. ejecutar el build y `npx wrangler deploy --dry-run`;
8. confirmar que ninguna credencial, token ni Calendar ID aparece en archivos versionados, frontend o logs;
9. no crear una reserva real durante un preflight: el envío persiste en Calendar y puede notificar invitados.

## Git

- Hacer cambios pequeños y revisables.
- No borrar el export original.
- Evitar refactors ajenos a la demo o a la Propuesta 1.
- Mantener `main`, Sites, Cloudflare y DNS separados de una validación local.
- La bitácora vive solo en `local/bitacora-propuesta-1`; no publicarla ni incorporarla a la rama de producto.

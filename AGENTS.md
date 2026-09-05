# AGENTS.md — Evolution Studio / Simbyte

## Objetivo

Trabajar sobre esta landing como **demo comercial mobile-first** para Evolution Studio, evolucionando hacia la **Propuesta 1**: un flujo de reserva propio, respaldado por un backend mínimo (Cloudflare Pages Functions) que registra la cita en Google Calendar, la respalda en Google Sheets y notifica al dueño. El contexto técnico completo vive en `docs/CONTEXTO_CLAUDE_CODE_PROPUESTA_1_EVOLUTION.md`; para el alcance definido ahí ya no aplica la restricción histórica de "no construir el sistema de agendamiento".

## Enfoque técnico

- Mantener el frontend deliberadamente simple: HTML/CSS/JS actual, sin migrar a React, Vite, Next.js u otro framework salvo necesidad demostrable y aprobada.
- Para la Propuesta 1 se permite un backend mínimo bajo Cloudflare Pages Functions (`functions/`), con integración a Google Calendar y Google Sheets vía sus APIs oficiales. Fuera de ese alcance —dashboard, login, CRM, WhatsApp API, pagos— sigue sin autorizarse (ver exclusiones en `docs/CONTEXTO_CLAUDE_CODE_PROPUESTA_1_EVOLUTION.md`).
- Los secretos (credenciales de la cuenta de servicio de Google, tokens, direcciones de notificación) se manejan únicamente mediante variables de entorno / secretos de Cloudflare. Nunca en el repositorio, en el frontend ni en logs.
- Trabajar primero sobre `index.html` y reutilizar `support.js` / `image-slot.js` mientras sigan siendo necesarios.
- `reference/original-export/` es solo respaldo: no modificarlo.
- Usar `assets/reference/` como material de referencia; no asumir que una captura de Instagram es un asset final de producción.

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

Servidor local:

```bash
python3 -m http.server 4173
```

Antes de cerrar cambios visuales:

1. comprobar que la página carga sin errores visibles;
2. revisar 375, 390, 430 y 768 px;
3. comprobar que el CTA de reserva usa `/reservar` como flujo propio, sin apuntar a Vortexa;
4. comprobar que Instagram conserva `@evolution_barbercut`;
5. confirmar que no aparezcan datos no verificados como si fueran reales;
6. confirmar que ninguna credencial, token o secreto aparece en el repositorio, el frontend o los logs.

## Git

- Hacer cambios pequeños y revisables.
- No borrar el export original.
- Evitar refactors ajenos a la demo o a la Propuesta 1.

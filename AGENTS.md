# AGENTS.md — Evolution Studio / Simbyte

## Objetivo

Trabajar sobre esta landing como **demo comercial mobile-first** para Evolution Studio. La acción principal es conducir al sistema de reserva que el negocio ya utiliza. No construir ni reemplazar el sistema de agendamiento.

## Enfoque técnico

- Mantener la solución deliberadamente simple: HTML/CSS/JS actual, sin migrar a React, Vite, Next.js u otro framework salvo necesidad demostrable y aprobada.
- No agregar backend, base de datos, CMS, autenticación ni dependencias de npm para esta etapa.
- Trabajar primero sobre `index.html` y reutilizar `support.js` / `image-slot.js` mientras sigan siendo necesarios.
- `reference/original-export/` es solo respaldo: no modificarlo.
- Usar `assets/reference/` como material de referencia; no asumir que una captura de Instagram es un asset final de producción.

## Hechos confirmados por material entregado

- Marca visible: Evolution Studio.
- Instagram: `@evolution_barbercut`.
- Ubicación indicada: Quinta de Tilcoco.
- Dirección visible: Avenida Argomedo 1591, Local C.
- Reserva existente: `https://vortexa.cl/saas/evolution/gestion_horas/reservar`.
- Identidad visual observada: fondo negro y logotipo/acento dorado.

## Contenido no validado

El export actual contiene textos de servicios, promociones, reseñas de ejemplo, horarios y otras afirmaciones que no fueron confirmadas por el cliente. No presentarlas como hechos. Si una sección depende de información no validada, ocultarla, neutralizarla o dejarla explícitamente como muestra hasta contar con evidencia.

## Reglas de producto

- Prioridad: móvil primero. Revisar 375, 390, 430 y 768 px.
- CTA principal: `Reservar hora` hacia Vortexa.
- El usuario debe entender qué es Evolution y poder reservar con poca fricción.
- Logo real antes que una recreación tipográfica si la calidad disponible lo permite.
- Las imágenes deben reforzar local, trabajo o equipo; evitar decoración genérica que parezca inventada.
- No presentar Simbyte como agencia web ni como reemplazo del sistema existente.
- No expandir alcance durante esta etapa.

## Validación

Servidor local:

```bash
python3 -m http.server 4173
```

Antes de cerrar cambios visuales:

1. comprobar que la página carga sin errores visibles;
2. revisar 375, 390, 430 y 768 px;
3. comprobar que el CTA de reserva conserva la URL Vortexa;
4. comprobar que Instagram conserva `@evolution_barbercut`;
5. confirmar que no aparezcan datos no verificados como si fueran reales.

## Git

- Hacer cambios pequeños y revisables.
- No borrar el export original.
- Evitar refactors ajenos a la demo.

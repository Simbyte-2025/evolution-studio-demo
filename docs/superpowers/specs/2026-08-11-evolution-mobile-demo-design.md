# Evolution Studio mobile demo — diseño

**Fecha:** 2026-08-11

## Alcance

Preparar una base local mínima para que Codex transforme el export actual de Evolution Studio en una landing mobile-first para visita comercial.

## Decisiones

- Reutilizar el export actual en vez de migrar de stack.
- Repositorio Git local y `AGENTS.md` como contexto durable.
- Sin npm ni framework para esta etapa.
- Preservar export original íntegro como referencia.
- Separar material visual de referencia de los assets que eventualmente se consideren finales.
- No modificar la lógica de reserva; mantener Vortexa como destino del CTA.

## Arquitectura

`index.html` sigue siendo el único documento editable de la demo. `support.js` e `image-slot.js` conservan el runtime del export. Los materiales de origen quedan bajo `reference/`; las capturas actuales quedan bajo `assets/reference/`. Codex recibe reglas y hechos mediante `AGENTS.md` y `docs/evolution-brief.md`.

## Validación

Servidor estático con Python, sin build. La siguiente iteración visual se considera aceptable cuando se revise en 375, 390, 430 y 768 px, preserve enlaces reales y no muestre contenido no validado como hechos.

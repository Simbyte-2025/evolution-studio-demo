# Simbyte — Evolution Studio demo

Repositorio local para preparar la demo comercial mobile-first de **Evolution Studio**.

## Objetivo inmediato

Presentar una demo comercial mobile-first que integra la landing y una simulación completa de reserva dentro del mismo sitio. La demo permite recorrer servicio → barbero → fecha/hora → confirmación, pero no guarda datos ni crea citas reales.

## Ejecutar localmente

No requiere npm, framework ni instalación de dependencias.

```bash
python3 -m http.server 4173
```

Abrir:

```text
http://localhost:4173/
http://localhost:4173/reservation-prototype/
```

## Estructura

- `index.html`: landing principal; sus CTA abren `/reservar` en la publicación de Sites.
- `reservation-prototype/`: fuente del flujo de reserva simulado y su versión HTML portátil.
- `support.js` / `image-slot.js`: runtime mínimo requerido por el export actual.
- `assets/reference/`: capturas entregadas por Nicolás como referencia visual y de identidad.
- `reference/original-export/`: export original íntegro; no editar.
- `AGENTS.md`: instrucciones persistentes para Codex.
- `docs/evolution-brief.md`: hechos, inferencias, supuestos y alcance.
- `docs/baseline/`: capturas de referencia del estado inicial, si la previsualización local puede generarlas.

## Límite de la demo

Esta versión sustituye la redirección anterior a Vortexa únicamente para la demostración publicada. Los servicios, precios, barberos y horarios del flujo son datos de muestra. No hay backend, persistencia, disponibilidad real, notificaciones ni integración externa.

## Criterio de terminado

La portada y el flujo deben verse correctamente en 375, 390, 430, 768 y 1440 px; `/reservar` debe funcionar dentro del dominio publicado; la simulación debe identificarse claramente y no debe existir ningún enlace, petición o redirección a Vortexa en el sitio.

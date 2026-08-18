# Simbyte — Evolution Studio demo

Repositorio local para preparar la demo comercial mobile-first de **Evolution Studio**.

## Objetivo inmediato

Mejorar visualmente la landing existente para mostrarla en una visita comercial, priorizando teléfono y conservando el sistema de reserva actual de Evolution.

## Ejecutar localmente

No requiere npm, framework ni instalación de dependencias.

```bash
python3 -m http.server 4173
```

Abrir:

```text
http://localhost:4173/
```

## Estructura

- `index.html`: archivo de trabajo actual, importado sin rediseño desde el export recibido.
- `support.js` / `image-slot.js`: runtime mínimo requerido por el export actual.
- `assets/reference/`: capturas entregadas por Nicolás como referencia visual y de identidad.
- `reference/original-export/`: export original íntegro; no editar.
- `AGENTS.md`: instrucciones persistentes para Codex.
- `docs/evolution-brief.md`: hechos, inferencias, supuestos y alcance.
- `docs/baseline/`: capturas de referencia del estado inicial, si la previsualización local puede generarlas.

## Criterio de terminado de la próxima iteración

La landing debe verse correctamente en 375, 390, 430 y 768 px; el logo y las imágenes deben integrarse sin romper la identidad negra/dorada; el CTA principal debe llevar al sistema Vortexa existente; no se deben presentar como reales servicios, promociones, reseñas, horarios o capacidades que no estén verificadas.

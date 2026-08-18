# Evolution Studio — Design QA, iteración 2

## Evidencia

- Fuente visual: `docs/baseline/mobile-review/03-390x844-full-page.jpg` y `docs/baseline/mobile-review/05-768x1024-viewport.jpg`.
- Implementación: `docs/iterations/mobile-review-v2/03-390x844-full-page.jpg` y `docs/iterations/mobile-review-v2/05-768x1024-viewport.jpg`.
- Viewports CSS: 390 × 844 y 768 × 1024.
- Densidad: capturas 1:1; baseline móvil 390 × 2123 px, iteración 2 móvil 390 × 1425 px; ambas capturas tablet 768 × 1024 px.
- Estado: página inicial, sin desplazamiento ni interacción previa.

## Comparación de vista completa

- La jerarquía requerida se conserva: ubicación, nombre, explicación, reserva e Instagram.
- El logo circular grande desaparece del hero y el activo real queda integrado una sola vez en el header.
- `Reservar hora` mantiene el único tratamiento de botón dorado dentro del hero; Instagram queda como enlace de texto.
- La información confirmada pasa de dos tarjetas altas a una lista compacta separada por líneas.
- La llamada final elimina la repetición del nombre y reduce altura.
- En 768 px, el hero usa dos columnas de contenido sin conservar el gran vacío inferior del baseline.

No se necesitaron recortes focalizados adicionales: header, logo, tipografía, CTA, enlaces y separadores son legibles en las capturas 1:1 usadas en la comparación.

## Superficies de fidelidad

- Tipografía: se mantienen Cormorant Garamond y Jost, la jerarquía serif/sans y los pesos existentes.
- Espaciado: se reducen header, hero, datos, reserva y footer; la altura completa a 390 px baja de 2123 a 1425 px.
- Color: se conserva negro, marfil y dorado; los gradientes permanecen oscuros y discretos.
- Imagen: se usa únicamente `assets/reference/evolution-logo-instagram.jpeg`; no se incorporan imágenes nuevas.
- Contenido: permanecen solo Evolution Studio, Quinta de Tilcoco, la dirección confirmada, Instagram y la agenda Vortexa.

## Verificación funcional visible

- Los tres enlaces de reserva conservan `https://vortexa.cl/saas/evolution/gestion_horas/reservar`.
- Los tres accesos a Instagram conservan `https://instagram.com/evolution_barbercut`.
- El CTA principal aparece completo dentro del primer viewport en 375, 390, 430 y 768 px.
- No existe overflow horizontal en los cuatro tamaños.
- La consola del navegador no registra errores ni advertencias.

## Historial de comparación

- Primera comparación: no se detectaron diferencias P0, P1 o P2 respecto del brief aprobado. La ausencia de fotografías se clasifica como restricción esperada, no como defecto de esta iteración.

final result: passed

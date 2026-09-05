# Design QA — Evolution Studio reservation prototype

## Comparison target

- Source URL: `https://evolution-studio-demo.nicolascaballero.chatgpt.site/`.
- Source visual truth: `qa/source/sites-source-390x844.png` and `qa/source/sites-source-1440x1000.png`.
- Rendered implementation: `http://127.0.0.1:4173/reservation-prototype/index.html`.
- Implementation evidence: `qa/implementation/prototype-step1-initial-390x844.png`, `prototype-step1-selected-390x844.png`, `prototype-step2-selected-390x844.png`, `prototype-step3-selected-390x844.png`, `prototype-step4-validation-390x844.png`, `prototype-success-390x844.png`, and `prototype-step1-initial-1440x1000.png`.
- Full-view combined evidence: `qa/comparisons/mobile-full-source-vs-prototype.png` and `qa/comparisons/desktop-full-source-vs-prototype.png`, with the Sites demo on the left and the prototype on the right.
- Focused combined evidence: `qa/comparisons/focus-brand-title-card-button.png` for logo/header, eyebrow/title, selected card and primary CTA; `qa/comparisons/focus-source-calendar-form.png` for the source visual system beside the calendar, slots, form, summary, action buttons and bottom navigation.

The Sites page is the visual-language source, while the existing four-step prototype is the functional and information-architecture source. The comparison therefore evaluates identity, typography, palette, surfaces, density, states and polish rather than requiring the booking flow to reproduce the landing page's section layout.

## Viewports and normalization

- Mobile source and implementation: 390 × 844 CSS px, density 1. Source full-page pixels: 390 × 1425. Initial implementation full-page pixels: 390 × 971. The full-view comparison pads the shorter image with `#090909`; it does not rescale either capture.
- Desktop source and implementation: 1440 × 1000 CSS px, density 1. Source full-page pixels: 1440 × 1334. Initial implementation full-page pixels: 1440 × 1007. The comparison pads the implementation with `#090909`; it does not rescale either capture.
- Additional implementation checks: 375 × 844, 430 × 932 and 768 × 1000 CSS px, density 1.
- Focused regions are direct 1:1 crops from the 390 px captures. No browser chrome, device frame or density conversion is present.

## State and interaction coverage

- Step 1 initial service list and selected-service state, including the sticky primary CTA.
- Step 2 initial and selected barber, colored data avatar, gold selection ring, expertise panel and enabled Continue action.
- Step 3 month change from August to September 2026, date selection, available slots, selected 4:30 PM slot and disabled/enabled Continue states.
- Step 4 empty required-field validation, labelled fields, appointment summary, Back action and confirmation with fictitious local data.
- Completion screen “Reserva simulada” with local reference `#DEMO01`; no real appointment was created.
- Bottom navigation, Volver and Continuar were exercised. Returning from step 4 to step 3 and navigating to Barberos from the bottom navigation both worked.
- Browser console after the complete journey: zero warnings and zero errors.

## Findings

- No actionable P0/P1/P2 findings remain.
- Fonts and typography: the implementation uses local WOFF2 files for Cormorant Garamond and Jost, matching the source's editorial display/body pairing. Brand, titles, service and barber names, calendar and confirmation number use Cormorant Garamond; labels, navigation, prices, descriptions, fields and buttons use Jost. Weight, line height, uppercase tracking, truncation and wrapping remain readable at every tested width.
- Spacing and layout rhythm: the functional column remains deliberately compact, but mobile edge padding, vertical rhythm, card gaps, stepper offsets, fixed header/navigation, sticky action area and desktop centring read as the same sober editorial system as the source. Radii are reduced to 2–4 px, borders are thin and warm, and no dashboard-like blue surfaces remain. There is no horizontal overflow at 375, 390, 430, 768 or 1440 px.
- Colors and visual tokens: the visible system maps to `#090909`, `#0f0f0f`, `#141311`, `#2d2922`, `#c9a54b`, `#ead07f`, `#f4f0e8`, `#b4aea4` and `#918a7f`. Primary actions use `linear-gradient(135deg, #ead07f, #c9a54b 58%, #9b792d)`. Selected states add a restrained gold radial treatment; disabled states remain clearly inactive without introducing cool-grey drift.
- Image quality and asset fidelity: the real Evolution logo image is copied locally and uses the source crop (`top: -91.04%`, `left: -25.6%`, `width: 151.36%`) in a 36 px mobile / 40 px desktop circular mark. It remains sharp at density 1 and integrates with the black header without halos. Bootstrap Icons remain local and consistently recoloured; no handmade SVG, emoji, placeholder art or hotlinked asset is used.
- Copy and content: the visible brand is now exactly “Evolution Studio”. The landing's address, Instagram, hero, footer and promotional copy were not inserted into the booking flow. Services, staff, prices, dates and slots remain the pre-existing dated mock data. The completion copy explicitly says that the result is simulated and that no real appointment was created.
- States and interaction: service, barber, calendar-day and slot selection are visibly distinct; primary, secondary and disabled buttons preserve a coherent hierarchy; form error, summary and success surfaces use the same token system. Hover rules warm borders or brighten the gold gradient, and `:focus-visible` adds a two-pixel gold-light outline with three-pixel offset. `prefers-reduced-motion` remains in place.
- Responsiveness and accessibility: no overlapping elements, hidden primary controls or horizontal clipping were observed at the five requested widths. Form labels remain programmatically associated with their fields, header logo alt text is intentionally empty because the adjacent brand text names it, tap targets remain practical, and console output stays clean.
- Network boundary: the prototype contains no `fetch`, `XMLHttpRequest`, Vortexa URL, API endpoint, remote font, external script, external stylesheet or external image source. The previously unused API-path constant was removed. Confirmation only mutates the local DOM.

## Comparison history

1. Pre-implementation baseline: the functional prototype used the old Evolution Barbercut wordmark, Cormorant/Montserrat, blue-black surfaces, larger generic radii and a flat muted-gold action style. Those differences were the approved implementation scope rather than a formal post-build QA finding.
2. Implementation pass: applied the Sites logo crop, “Evolution Studio” lockup, local Cormorant Garamond/Jost, exact palette and primary gradient, warm sharp-edged surfaces, selected/disabled states, radial lighting, focus styling and navigation treatment without changing the booking logic.
3. First formal combined comparison: opened `mobile-full-source-vs-prototype.png`, `desktop-full-source-vs-prototype.png`, `focus-brand-title-card-button.png` and `focus-source-calendar-form.png`. No actionable P0/P1/P2 visual difference was found, so no visual correction was made in response to this pass.
4. Boundary check after visual QA: a static test exposed an unused relative API-path constant. It was removed and the local-only test returned to green. This did not change the rendered visual evidence.

## Open questions

- None blocking. The source page and prototype intentionally have different information architecture: the former is a landing page, the latter is the existing booking journey. The approved scope is identity transfer, not a pixel clone of the landing sections.

## Implementation checklist

- [x] Source and implementation captured at 390 × 844 and 1440 × 1000, density 1.
- [x] Full-view and focused combined comparisons opened and reviewed.
- [x] Header/logo, eyebrow/title, selected card, buttons, calendar, form, summary and navigation reviewed.
- [x] Typography, spacing, tokens, logo/asset quality, icons, content and interaction states explicitly evaluated.
- [x] Complete four-step journey and simulated confirmation exercised with fictitious local data.
- [x] 375, 390, 430, 768 and 1440 px checked with zero horizontal overflow.
- [x] Browser console checked with zero warnings and zero errors.
- [x] No remote connections, Vortexa endpoint, remote fonts or data submission remain.

## Follow-up polish

- P3: if this mock later becomes a production booking interface, the selectable service cards, barber cards, calendar days and time slots should become semantic buttons with full keyboard selection behaviour. That would intentionally change markup/interaction semantics and is outside this visual-only implementation.

(Resultado de la primera pasada: aprobado. El veredicto vigente está al final del documento.)

---

## Segunda pasada — sistema editorial (31 de agosto de 2026)

La primera pasada transfirió identidad (logo, paleta, tipografías). Esta segunda transfiere el **sistema de composición** del demo público, sin tocar paleta, tipografías ni logo, y sin alterar el flujo de cuatro pasos.

### Cambios aplicados

- **Header y stepper pasan de `fixed` a `sticky`.** Liberan ~127 px de alto permanente; es el mismo mecanismo que usa `.site-header` en el demo. Ningún control cambia de comportamiento.
- **Escala tipográfica del demo.** `.gh-page-title` sube de `2rem` a `clamp(2.9rem,13vw,3.5rem)` con `line-height:.88` y segunda línea en itálica dorada (`h1 span`), que es la firma visual del demo.
- **Eyebrow con filete.** `.gh-step-tag` adopta `letter-spacing:.25em` y el `::before` de 26 px del demo.
- **Cajas → filetes.** Servicios, barberos, panel de barbero, calendario, formulario y resumen dejan de ser tarjetas con borde y radio y pasan al sistema `.fact-list` del demo: reglas de 1 px arriba/abajo, sin fondo, sin radio.
- **Un solo lenguaje de selección.** Servicio: filete dorado al margen. Barbero: anillo dorado. Día y horario: `--gold-dim` + borde `--gold`. El degradado `--primary-gradient` queda reservado al CTA primario de cada paso.
- **Avatares de barbero.** El color de dato deja de ser un disco saturado y pasa a un anillo de 1 px; conserva la identidad sin competir con la marca.
- **Campos de formulario subrayados**, en la línea de `.text-link` / `.instagram-link` del demo.
- **Retícula de escritorio (≥900 px).** `--content: 1120px`, dos columnas: columna lateral fija con el resumen corrido de la reserva (`aria-hidden`, duplica lo ya visible en el flujo) y columna de flujo. Header, stepper, barra fija y navegación inferior se alinean a la misma retícula. Antes el escritorio mostraba una columna de 540 px sobre fondo vacío.
- **Copy en el registro del demo.** "Elige tu artesano / Cada corte es una firma" → "Elige tu barbero / Reserva con quien prefieras del equipo del estudio". "Paso 4 de 4 — Confirmación / Finalizar reserva" → "Paso 4 de 4 / Confirma tu reserva".
- **Pantalla final** alineada a la izquierda, con eyebrow, título en dos líneas y la referencia sobre filetes.

### Defectos encontrados y corregidos

- **P1 — El mensaje de validación nunca se veía.** `confirmar()` hacía `errEl.style.display = ''`, que devuelve el elemento al `display:none` de la hoja de estilos en lugar de mostrarlo. Ahora usa `classList` (`.gh-err.vis`), lleva `role="alert"` y mueve el foco al primer campo vacío.
- **P2 — El documento se renderizaba en quirks mode.** Faltaba `<!DOCTYPE html>`. Añadido; `document.compatMode` ahora es `CSS1Compat` y la consola queda limpia.
- **P2 — Doble sangrado en los horarios.** `.gh-slots-section` y su `.gh-pad` interior aplicaban 20 px cada uno; los horarios quedaban 20 px más adentro que el calendario. Corregido.
- **P3 — Dato inventado.** El panel de barbero mostraba "Ranking: Top" para todos. Sustituido por la duración real del servicio elegido.
- **P3 — `text-transform:capitalize` sobre la fecha** producía "Viernes, 4 De Septiembre". Ahora se capitaliza sólo la primera letra.

### Verificación

- Recorrido completo servicio → barbero → fecha/hora → confirmación ejercitado en 390 × 844 y 1440 × 1000, más comprobación en 375, 430 y 768 px.
- `document.documentElement.scrollWidth` igual al ancho del viewport en todos los anchos probados: sin desbordamiento horizontal.
- Consola sin advertencias ni errores tras el recorrido completo.
- Sin conexiones remotas nuevas: el archivo sigue siendo autocontenido.

### Pendiente (fuera de esta pasada, cambia semántica o flujo)

- Tarjetas de servicio, barbero, día y horario como `<button>` con selección por teclado.
- La navegación inferior permite saltar a pasos aún no válidos; `ir()` los rechaza en silencio, sin decir por qué.
- En escritorio, el "Resumen de cita" del paso 4 duplica la columna lateral.

(Resultado de la segunda pasada: aprobado.)

---

## Tercera pasada — fidelidad de paleta y tipografía

Corrección a petición de Nicolás: mantener la tipografía, las fuentes y la **paleta completa** del demo, y revertir lo que no se había pedido.

### Paleta

Auditados todos los hex del bloque de estilos propio. Antes quedaban tres valores fuera del sitio:

- `#3a342a` (`--border-2`) → `rgba(201,165,75,.22)`, el filete dorado del header del demo.
- `#050505` (fondo de la marca) → `#000`, el recorte del demo.
- `#191816` / `#555047` / `#25221d` (botón deshabilitado) → `var(--surface)` / `#817a70` / `var(--border)`.

Y faltaban por usar los tonos de banda del demo. Recuperados como bandas de sección, no como tarjetas:

- `.gh-page-head` = banda `.hero`: `linear-gradient(180deg, #0d0d0d, #090909)` + `radial-gradient(circle at 82% 20%, rgba(201,165,75,.11), transparent 34%)`.
- Listas, calendario, formulario y resumen = banda `.facts`: `linear-gradient(180deg, #0f0f0f, #0c0c0c)`, a sangre, con relleno interior de 20 px y filete inferior.
- `.gh-actions` y la pantalla final = banda `.booking`: `radial-gradient(circle at 50% 0%, rgba(201,165,75,.10), transparent 46%)` sobre negro.
- `.gh-nav` y `.gh-sticky` conservan `#080808`, el tono del footer del demo.
- `--surface` (`#141311`) vuelve a usarse en las fichas de horario y en los controles del calendario.

Único hex que no está en el demo: `#ea868f` con `rgba(220,53,69,.75)`, el rojo del mensaje de error. El demo no tiene estado de error y un error no puede ser dorado.

### Tipografía

- Sólo Cormorant Garamond y Jost, sin cambios.
- Eliminados los dos `font-weight:700` (panel de barbero y día actual). Las familias incrustadas declaran el rango `400 600`, así que ese 700 era una negrita sintética. Ahora todos los pesos son 400/500/600, los mismos que carga el demo.

### Textos revertidos

"Selecciona un servicio", "Elige tu artesano / Cada corte es una firma…", "Paso 4 de 4 — Confirmación / Finalizar reserva", "Nombre y teléfono son obligatorios.", "Al confirmar aceptas nuestra política de cancelación.", la pantalla de éxito y "Ranking: Top" vuelven a su redacción original. Se conserva el tratamiento tipográfico (segunda línea en itálica dorada), que es del demo, aplicado sobre las palabras originales.

Se conservan las tres correcciones de defecto de la pasada anterior (doctype, mensaje de validación que nunca se mostraba, doble sangrado de los horarios), que no son cambios de texto ni de paleta.

### Verificación

- Recorrido completo en 390 × 844 y 1440 × 1000; `scrollWidth` igual al viewport en 375, 390, 430, 768 y 1440 px.
- Consola sin advertencias ni errores.
- Los hex del prototipo son ahora un subconjunto exacto de los del demo, más el rojo de error.

final result: passed

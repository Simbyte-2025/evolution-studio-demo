# Evolution Studio Mobile Demo First Iteration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir la landing actual en una demo comercial mobile-first breve, reconocible como Evolution Studio y centrada en la reserva Vortexa existente.

**Architecture:** Mantener una página estática en `index.html` y sustituir el export dinámico por HTML/CSS semántico cuando sus componentes de muestra ya no sean necesarios. Usar la captura real disponible como fuente visual provisional del logo mediante un recorte CSS controlado, sin alterar `assets/reference/` ni `reference/original-export/`.

**Tech Stack:** HTML5, CSS, servidor estático `python3 -m http.server` y navegador local.

## Global Constraints

- No migrar a React, Vite, Next.js ni otro framework.
- No agregar backend, base de datos, CMS, autenticación ni dependencias npm.
- Mantener `https://vortexa.cl/saas/evolution/gestion_horas/reservar` como destino de todo CTA `Reservar hora`.
- Mantener `https://instagram.com/evolution_barbercut` y el texto `@evolution_barbercut`.
- Mostrar únicamente Evolution Studio, Quinta de Tilcoco y Avenida Argomedo 1591, Local C como hechos del negocio.
- Ocultar servicios, promociones, reseñas, horarios, nombres del equipo y promesas operativas no confirmadas.
- No modificar `reference/original-export/` ni los archivos bajo `assets/reference/`.
- Validar 375, 390, 430 y 768 px sin overflow horizontal.

---

### Task 1: Simplificar contenido y jerarquía de conversión

**Files:**
- Modify: `index.html`
- Create: `tests/test_index.py`

**Interfaces:**
- Consumes: `assets/reference/evolution-logo-instagram.jpeg` como material visual real entregado.
- Produces: una única página semántica con encabezado persistente, hero, información confirmada, CTA final y pie.

- [x] **Step 1: Escribir pruebas de contenido y estructura**

Crear `tests/test_index.py` con `unittest` para exigir:

```python
from pathlib import Path
import unittest

HTML = Path(__file__).parents[1].joinpath("index.html").read_text()


class LandingContentTests(unittest.TestCase):
    def test_uses_confirmed_destinations_and_identity(self):
        self.assertGreaterEqual(HTML.count("https://vortexa.cl/saas/evolution/gestion_horas/reservar"), 3)
        self.assertIn("@evolution_barbercut", HTML)
        self.assertIn("Avenida Argomedo 1591, Local C", HTML)
        self.assertIn("assets/reference/evolution-logo-instagram.jpeg", HTML)

    def test_removes_unverified_claims_and_placeholders(self):
        for forbidden in (
            "Cuatro barberos", "Servicios", "Beneficios vigentes", "Reseña de ejemplo",
            "Disponibilidad en tiempo real", "showPromos", "showTestimonios", "<image-slot"
        ):
            self.assertNotIn(forbidden, HTML)

    def test_has_semantic_page_structure(self):
        self.assertIn('<html lang="es">', HTML)
        self.assertEqual(HTML.count("<h1"), 1)
        self.assertIn("Evolution Studio | Quinta de Tilcoco", HTML)
        self.assertIn(":focus-visible", HTML)
```

Ejecutar `python3 -m unittest tests/test_index.py -v`. Esperado: FAIL porque el export actual no cumple estas reglas.

- [x] **Step 2: Sustituir el export por una estructura estática mínima**

Implementar en `index.html`:

```html
<header class="site-header">
  <a class="brand" href="#inicio" aria-label="Evolution Studio, inicio">
    <span class="brand-mark" aria-hidden="true"></span>
    <span>Evolution Studio</span>
  </a>
  <a class="button button-small" href="https://vortexa.cl/saas/evolution/gestion_horas/reservar">Reservar hora</a>
</header>
<main>
  <section id="inicio" class="hero" aria-labelledby="hero-title">
    <h1 id="hero-title">Evolution Studio</h1>
    <a class="button" href="https://vortexa.cl/saas/evolution/gestion_horas/reservar">Reservar hora</a>
  </section>
  <section class="facts" aria-labelledby="facts-title">
    <h2 id="facts-title">Encuéntranos en Quinta de Tilcoco</h2>
  </section>
  <section class="booking" aria-labelledby="booking-title">
    <h2 id="booking-title">Agenda tu visita</h2>
  </section>
</main>
<footer class="site-footer">Evolution Studio · Quinta de Tilcoco</footer>
```

La página debe incluir `lang="es"`, `<title>Evolution Studio | Quinta de Tilcoco</title>`, un solo `h1`, enlaces externos con `rel="noopener noreferrer"` y estilos `:focus-visible`.

- [x] **Step 3: Integrar el logo real de referencia sin crear una marca nueva**

Usar `assets/reference/evolution-logo-instagram.jpeg` dentro de un contenedor circular con `background-size` y `background-position` medidos para mostrar solamente el emblema. Mantener el nombre textual `Evolution Studio` junto al emblema para legibilidad y accesibilidad; no convertir la captura completa de Instagram en hero ni en galería.

- [x] **Step 4: Verificar el contenido estático**

Ejecutar:

```bash
python3 -m unittest tests/test_index.py -v
```

Esperado: 4 pruebas en estado `OK`.

### Task 2: Validar comportamiento responsive y evidencia visual

**Files:**
- Verify: `index.html`
- Create outside repository: `/Users/macbookdenico/.codex/visualizations/2026/08/11/019fef3e-6313-7a11-b503-1b2d9bee0cb7/evolution-final-{375,390,430,768}.jpg`

**Interfaces:**
- Consumes: la página estática terminada por Task 1 y `python3 -m http.server 4173`.
- Produces: evidencia visual y métricas de reflow en los cuatro anchos requeridos.

- [x] **Step 1: Recargar la página y revisar errores visibles**

Recargar `http://localhost:4173/`, esperar el estado `load`, inspeccionar el DOM y revisar errores o warnings de consola. Esperado: página cargada, logo visible, un `h1`, CTA visible y consola sin errores.

- [x] **Step 2: Capturar 375, 390, 430 y 768 px**

Usar alturas 812, 844, 932 y 1024 px respectivamente. En cada ancho guardar una captura inicial y una captura de página completa o, si el navegador no la representa correctamente, capturas por viewport que cubran todas las secciones.

- [x] **Step 3: Verificar métricas responsive y destinos**

En cada ancho comprobar:

```text
document.documentElement.scrollWidth === window.innerWidth
document.documentElement.scrollHeight < 3200
CTA superior con alto mínimo de 44 px
CTA del hero visible en el primer viewport
Todos los CTA Reservar hora apuntan a Vortexa
Instagram mantiene @evolution_barbercut
```

- [x] **Step 4: Revisar visualmente el resultado**

Comparar las capturas finales entre sí y con la captura de marca entregada. Confirmar jerarquía, logo sin interfaz de Instagram visible, negro/dorado consistente, espaciado compacto y ausencia de placeholders o afirmaciones no verificadas.

- [x] **Step 5: Revisar el diff sin crear commit**

Ejecutar:

```bash
git diff --check
git status --short
git diff -- index.html docs/superpowers/plans/2026-08-11-evolution-mobile-demo-first-iteration.md
```

Esperado: sólo cambian `index.html`, `tests/test_index.py` y este plan; no hay cambios en `reference/original-export/` ni `assets/reference/`.

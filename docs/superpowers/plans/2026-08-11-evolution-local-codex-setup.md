# Evolution Studio Local Codex Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear un repositorio local mínimo y reproducible para iterar la landing de Evolution Studio con Codex sin introducir stack o infraestructura innecesaria.

**Architecture:** El export existente se conserva y una copia se usa como `index.html`. La ejecución usa un servidor HTTP estándar de Python. `AGENTS.md` y un brief separan hechos verificados de contenido no validado para orientar a Codex.

**Tech Stack:** HTML, CSS inline, JavaScript del export, Python `http.server`, Git.

## Global Constraints

- No migrar a React/Vite/Next.js para esta etapa.
- No agregar backend, base de datos ni npm.
- Mantener la URL Vortexa existente como CTA de reserva.
- Priorizar 375, 390, 430 y 768 px en la próxima iteración visual.
- No presentar contenido no verificado como hechos.

---

### Task 1: Importar una base reproducible

**Files:**
- Create: `index.html`
- Create: `support.js`
- Create: `image-slot.js`
- Create: `reference/original-export/*`
- Create: `assets/reference/*`

- [x] Copiar íntegramente el export original a `reference/original-export/`.
- [x] Copiar la landing Evolution a `index.html` sin rediseñarla todavía.
- [x] Copiar únicamente los archivos runtime necesarios al root.
- [x] Copiar las dos capturas actuales a `assets/reference/` con nombres descriptivos.

### Task 2: Dar contexto durable a Codex

**Files:**
- Create: `AGENTS.md`
- Create: `README.md`
- Create: `docs/evolution-brief.md`

- [x] Documentar objetivo, alcance y restricciones en `AGENTS.md`.
- [x] Separar hechos, inferencias, supuestos y riesgos de contenido en el brief.
- [x] Documentar un único comando de ejecución local sin dependencias.

### Task 3: Verificar la base local

**Files:**
- Create when possible: `docs/baseline/mobile-390.png`
- Create when possible: `docs/baseline/mobile-430.png`

- [ ] Iniciar `python3 -m http.server 4173` desde la raíz.
- [ ] Confirmar respuesta HTTP 200 de `/`.
- [ ] Generar captura headless a 390 px.
- [ ] Generar captura headless a 430 px.
- [ ] Confirmar que la URL Vortexa y el Instagram están presentes en `index.html`.
- [ ] Inicializar Git y registrar el baseline en un commit.

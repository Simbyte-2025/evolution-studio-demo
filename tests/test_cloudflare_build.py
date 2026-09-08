"""Cobertura del pipeline NUEVO de Cloudflare (public/ + index.real.html).

Es deliberadamente independiente de tests/test_sites_build.py: ese archivo
cubre el pipeline de Sites ya publicado y no se toca. Acá se verifica que
las dos fuentes HTML convivan sin contaminarse — la simulada sigue simulada,
la real llama de verdad a /api/* — y que ambas conserven la misma estructura
visual aprobada por el dueño.
"""

from pathlib import Path
import re
import subprocess
import unittest


ROOT = Path(__file__).parents[1]
PROTOTYPE = ROOT / "reservation-prototype"
SIMULATED_SOURCE = PROTOTYPE / "index.html"
REAL_SOURCE = PROTOTYPE / "index.real.html"

SIMULATED = SIMULATED_SOURCE.read_text()
REAL = REAL_SOURCE.read_text() if REAL_SOURCE.is_file() else ""

API_ENDPOINTS = ("/api/config", "/api/availability", "/api/bookings")


def style_blocks(html):
    return re.findall(r"<style>(.*?)</style>", html, re.DOTALL)


def class_tokens(html):
    """Clases del sistema de diseño aprobado (prefijo gh-).

    Se excluyen a propósito los íconos de Bootstrap (bi-*): en el flujo real
    los servicios llegan desde /api/config y su ícono se interpola, así que
    comparar bi-brush/bi-stars mediría los datos de muestra, no la interfaz.
    """
    tokens = set()
    for value in re.findall(r'\bclass="([^"]*)"', html):
        tokens.update(token for token in value.split() if token.startswith("gh-"))
    return tokens


def element_ids(html):
    return set(re.findall(r'\bid="([A-Za-z][\w-]*)"', html))


class SourceSeparationTests(unittest.TestCase):
    def test_simulated_source_keeps_the_demo_flow_and_never_calls_the_backend(self):
        self.assertIn("Demo interactiva · no crea una reserva real", SIMULATED)
        self.assertIn("Reserva simulada", SIMULATED)
        self.assertIn("DEMO_SLOTS", SIMULATED)
        self.assertNotIn("fetch(", SIMULATED)
        for endpoint in API_ENDPOINTS:
            with self.subTest(endpoint=endpoint):
                self.assertNotIn(endpoint, SIMULATED)

    def test_real_source_calls_the_three_backend_endpoints(self):
        self.assertTrue(REAL_SOURCE.is_file(), "falta reservation-prototype/index.real.html")
        for endpoint in API_ENDPOINTS:
            with self.subTest(endpoint=endpoint):
                self.assertIn(f"fetch('{endpoint}", REAL)
        self.assertIn("idempotencyKey", REAL)
        self.assertNotIn("Reserva simulada", REAL)
        self.assertNotIn("Demo interactiva · no crea una reserva real", REAL)
        self.assertNotIn("DEMO_SLOTS", REAL)

    def test_real_source_generates_one_idempotency_key_per_booking_attempt(self):
        # Si la clave se generara dentro de confirmar(), un doble clic crearía
        # dos claves distintas y dos eventos en Calendar — anulando el
        # pre-check de idempotencia del backend.
        confirmar = re.search(r"async function confirmar\(\) \{(.*?)\n\}", REAL, re.DOTALL)
        self.assertIsNotNone(confirmar)
        self.assertNotIn("crypto.randomUUID", confirmar.group(1))
        self.assertIn("state.idempotencyKey", REAL)

    def test_real_source_only_shows_success_when_the_backend_confirms(self):
        self.assertIn("SLOT_UNAVAILABLE", REAL)
        self.assertIn("bookingId", REAL)
        self.assertNotIn("'#DEMO'", REAL)

    def test_both_sources_start_with_a_doctype_and_declare_their_pipeline(self):
        for name, html, pipeline in (
            ("index.html", SIMULATED, "build-sites.mjs"),
            ("index.real.html", REAL, "build-cloudflare.mjs"),
        ):
            with self.subTest(source=name):
                self.assertTrue(html.startswith("<!DOCTYPE html>"))
                header = html[: html.index("<html")]
                self.assertIn("<!--", header)
                self.assertIn(pipeline, header)

    def test_real_source_keeps_the_approved_visual_structure(self):
        self.assertEqual(style_blocks(SIMULATED), style_blocks(REAL))
        # Dirección deliberada: subconjunto, no igualdad. Nada de lo aprobado
        # puede desaparecer; el flujo real sí puede sumar estados de carga y
        # error que la demo simulada no necesitaba.
        self.assertLessEqual(class_tokens(SIMULATED), class_tokens(REAL))
        self.assertLessEqual(element_ids(SIMULATED), element_ids(REAL))
        for label in ("Servicio", "Barbero", "Horario", "Confirmar"):
            with self.subTest(label=label):
                self.assertIn(f'<div class="gh-step-l">{label}</div>', REAL)
        self.assertEqual(len(re.findall(r'class="gh-step-i', REAL)), 4)
        self.assertIn("<title>Reservar — Evolution Studio</title>", REAL)
        self.assertIn('src="assets/evolution-logo-instagram.jpeg"', REAL)


class CloudflareBuildTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        build = subprocess.run(
            ["npm", "run", "build:cloudflare"],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        assert build.returncode == 0, f"build failed:\n{build.stdout}\n{build.stderr}"
        cls.public = ROOT / "public"

    def test_emits_the_landing_the_booking_page_and_the_static_assets(self):
        for relative in (
            "index.html",
            "reservar/index.html",
            "assets/reference/evolution-logo-instagram.jpeg",
            "favicon.ico",
        ):
            with self.subTest(relative=relative):
                self.assertTrue(self.public.joinpath(relative).is_file())
        self.assertEqual(
            self.public.joinpath("index.html").read_text(),
            ROOT.joinpath("index.html").read_text(),
        )

    def test_booking_page_is_self_contained_and_wired_to_the_real_backend(self):
        booking = self.public.joinpath("reservar/index.html").read_text()
        # Si un replace del inliner deja de coincidir, no falla: publica la
        # página sin fuentes ni íconos. Estas dos aserciones lo detectan.
        self.assertIn("data:font/woff2;base64,", booking)
        self.assertNotIn('href="assets/fonts.css"', booking)
        self.assertNotIn('href="assets/bootstrap-icons.css"', booking)
        for endpoint in API_ENDPOINTS:
            with self.subTest(endpoint=endpoint):
                self.assertIn(endpoint, booking)
        self.assertNotIn("Demo interactiva · no crea una reserva real", booking)

    def test_public_output_is_generated_and_never_versioned(self):
        self.assertIn("public/", ROOT.joinpath(".gitignore").read_text().splitlines())
        tracked = subprocess.run(
            ["git", "ls-files", "public/"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        self.assertEqual(tracked.stdout.strip(), "")


if __name__ == "__main__":
    unittest.main()

from pathlib import Path
import re
import unittest


ROOT = Path(__file__).parents[1]
PROTOTYPE = ROOT / "reservation-prototype"
HTML = PROTOTYPE.joinpath("index.html").read_text()
FONTS_CSS = PROTOTYPE.joinpath("assets/fonts.css").read_text()


class ReservationPrototypeIdentityTests(unittest.TestCase):
    def test_renders_evolution_studio_brand_with_local_logo(self):
        self.assertIn("<title>Reservar — Evolution Studio</title>", HTML)
        self.assertIn('class="gh-brand-mark"', HTML)
        self.assertIn('src="assets/evolution-logo-instagram.jpeg"', HTML)
        self.assertIn('class="gh-brand-copy"', HTML)
        self.assertRegex(HTML, r"<strong>Evolution</strong>\s*<span>Studio</span>")
        self.assertTrue(
            PROTOTYPE.joinpath("assets/evolution-logo-instagram.jpeg").is_file()
        )

    def test_serves_the_landing_font_families_from_local_files(self):
        self.assertIn('font-family: "Cormorant Garamond"', FONTS_CSS)
        self.assertIn('font-family: "Jost"', FONTS_CSS)
        self.assertNotIn("https://", FONTS_CSS)
        for filename in ("cormorant-garamond-latin.woff2", "jost-latin.woff2"):
            with self.subTest(filename=filename):
                self.assertIn(filename, FONTS_CSS)
                self.assertTrue(PROTOTYPE.joinpath("assets/fonts", filename).is_file())

    def test_applies_the_landing_palette_and_primary_gradient(self):
        for token in (
            "--bg:         #090909",
            "--surface:    #141311",
            "--border:     #2d2922",
            "--gold:       #c9a54b",
            "--gold-light: #ead07f",
            "--text:       #f4f0e8",
            "--text-muted: #b4aea4",
            "--text-dim:   #918a7f",
        ):
            with self.subTest(token=token):
                self.assertIn(token, HTML)
        self.assertIn(
            "linear-gradient(135deg,#ead07f,#c9a54b 58%,#9b792d)", HTML
        )
        self.assertNotIn("#09090F", HTML)
        self.assertNotIn("#111118", HTML)
        self.assertNotIn("#2A2A38", HTML)

    def test_keeps_the_four_step_local_only_reservation_flow(self):
        self.assertEqual(len(re.findall(r'class="gh-step-i', HTML)), 4)
        for label in ("Servicio", "Barbero", "Horario", "Confirmar"):
            self.assertIn(f'<div class="gh-step-l">{label}</div>', HTML)
        self.assertIn("Reserva simulada", HTML)
        self.assertNotIn("fetch(", HTML)
        self.assertNotIn("XMLHttpRequest", HTML)
        self.assertNotIn("vortexa", HTML.lower())
        self.assertNotIn("/saas/evolution/gestion_horas/api", HTML)
        self.assertNotIn("localStorage", HTML)
        self.assertNotIn("sessionStorage", HTML)
        self.assertNotRegex(HTML, r"document\.cookie")
        self.assertNotRegex(HTML, r'<(?:script|link|img)[^>]+(?:src|href)="https?://')

    def test_identifies_the_demo_and_returns_to_the_landing(self):
        self.assertGreaterEqual(
            HTML.count("Demo interactiva · no crea una reserva real"), 2
        )
        self.assertGreaterEqual(HTML.count("Datos de muestra"), 2)
        self.assertGreaterEqual(HTML.count('href="/"'), 2)
        self.assertIn("Esta demo no envía ni guarda tus datos.", HTML)
        self.assertIn("Nueva simulación", HTML)
        self.assertIn("reiniciarDemo()", HTML)

    def test_uses_semantic_selectable_controls_with_selection_state(self):
        self.assertNotRegex(HTML, r'<div class="gh-svc-card"[^>]+onclick=')
        self.assertNotRegex(HTML, r'<div class="gh-barb-card"[^>]+onclick=')
        self.assertNotRegex(HTML, r'<div class="gh-day[^\"]*"[^>]+onclick=')
        self.assertNotRegex(HTML, r'<div class="gh-slot"[^>]+onclick=')
        for class_name in ("gh-svc-card", "gh-barb-card", "gh-day", "gh-slot"):
            with self.subTest(class_name=class_name):
                self.assertRegex(
                    HTML,
                    rf'<button[^>]+class="[^"]*{class_name}[^"]*"[^>]+aria-pressed=',
                )

    def test_uses_a_dynamic_santiago_calendar_window(self):
        self.assertNotIn("const HOY      = '2026-08-31'", HTML)
        self.assertNotIn("const MAX_DATE = '2026-10-30'", HTML)
        self.assertIn("America/Santiago", HTML)
        self.assertIn("const WINDOW_DAYS = 60", HTML)
        self.assertIn("['15:00','15:30','16:00','16:30'", HTML)
        self.assertIn("'20:00','20:30']", HTML)
        self.assertIn("Sin horarios de muestra disponibles para este día", HTML)
        self.assertIn("Disponibilidad simulada", HTML)

    def test_displays_demo_slots_in_chilean_24_hour_format(self):
        self.assertIn("function fmtHora(h){", HTML)
        self.assertIn("return DEMO_SLOTS.includes(h) ? h : '';", HTML)
        self.assertNotIn("'PM' : 'AM'", HTML)

    def test_explains_invalid_navigation_and_supports_keyboard_users(self):
        self.assertIn('id="flowMessage"', HTML)
        self.assertIn('role="status"', HTML)
        self.assertIn('aria-live="polite"', HTML)
        self.assertIn("showFlowMessage", HTML)
        self.assertIn("aria-label=", HTML)
        self.assertIn("<noscript>", HTML)

    def test_marks_only_name_and_phone_as_required_fields(self):
        self.assertRegex(HTML, r'<input id="fNombre"[^>]+\brequired\b')
        self.assertRegex(HTML, r'<input id="fTel"[^>]+\brequired\b')
        self.assertNotRegex(HTML, r'<textarea id="fNotas"[^>]+\brequired\b')

    def test_new_simulation_clears_calendar_and_time_ui(self):
        reset_body = re.search(
            r"function reiniciarDemo\(\) \{(?P<body>.*?)\n\}", HTML, re.DOTALL
        )
        self.assertIsNotNone(reset_body)
        self.assertIn("renderCal();", reset_body.group("body"))
        self.assertIn("document.getElementById('slotsGrid').innerHTML = '';", reset_body.group("body"))

    def test_keeps_temporary_customer_data_in_memory_and_escapes_the_summary(self):
        self.assertIn("cliente: null", HTML)
        self.assertIn("state.cliente = { nombre, telefono: tel, notas };", HTML)
        self.assertIn("${xe(state.cliente.nombre)}", HTML)
        self.assertIn("${xe(state.cliente.telefono)}", HTML)

    def test_changing_service_clears_the_downstream_selection_ui(self):
        select_service_body = re.search(
            r"function selSvc\(id, el\) \{(?P<body>.*?)\n\}", HTML, re.DOTALL
        )
        self.assertIsNotNone(select_service_body)
        body = select_service_body.group("body")
        self.assertIn("state.barbero = null; state.fecha = null; state.hora = null;", body)
        self.assertIn("#barbGrid .gh-barb-card", body)
        self.assertIn("document.getElementById('expertise').className = 'gh-expertise';", body)


if __name__ == "__main__":
    unittest.main()

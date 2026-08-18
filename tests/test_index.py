from pathlib import Path
import unittest


HTML = Path(__file__).parents[1].joinpath("index.html").read_text()


class LandingContentTests(unittest.TestCase):
    def test_uses_confirmed_destinations_and_identity(self):
        self.assertGreaterEqual(
            HTML.count(
                "https://vortexa.cl/saas/evolution/gestion_horas/reservar"
            ),
            3,
        )
        self.assertIn("@evolution_barbercut", HTML)
        self.assertIn("Avenida Argomedo 1591, Local C", HTML)
        self.assertIn("assets/reference/evolution-logo-instagram.jpeg", HTML)

    def test_removes_unverified_claims_and_placeholders(self):
        for forbidden in (
            "Cuatro barberos",
            "Servicios",
            "Beneficios vigentes",
            "Reseña de ejemplo",
            "Disponibilidad en tiempo real",
            "perfil oficial",
            "showPromos",
            "showTestimonios",
            "<image-slot",
        ):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, HTML)

    def test_has_semantic_page_structure(self):
        self.assertIn('<html lang="es">', HTML)
        self.assertEqual(HTML.count("<h1"), 1)
        self.assertIn("Evolution Studio | Quinta de Tilcoco", HTML)
        self.assertIn(":focus-visible", HTML)

    def test_footer_separates_location_from_address_on_mobile(self):
        self.assertIn('<span class="footer-location">Quinta de Tilcoco</span>', HTML)
        self.assertIn(
            '<span class="footer-address">Avenida Argomedo 1591, Local C</span>',
            HTML,
        )

    def test_compacts_header_and_uses_responsive_reservation_label(self):
        self.assertIn('<span class="cta-label-short">Reservar</span>', HTML)
        self.assertIn('<span class="cta-label-long">Reservar hora</span>', HTML)
        self.assertIn("@media (max-width: 399px)", HTML)

    def test_removes_redundant_hero_and_footer_logos(self):
        self.assertNotIn('class="hero-brand"', HTML)
        self.assertEqual(
            HTML.count(
                '<img src="assets/reference/evolution-logo-instagram.jpeg"'
            ),
            1,
        )

    def test_instagram_is_a_discreet_secondary_action(self):
        self.assertIn('class="instagram-link"', HTML)
        self.assertIn("Ver trabajos en Instagram", HTML)
        self.assertNotIn("button-secondary", HTML)

    def test_confirmed_information_is_not_presented_as_cards(self):
        self.assertIn('class="fact-list"', HTML)
        self.assertIn('class="fact-item"', HTML)
        self.assertNotIn("fact-card", HTML)

    def test_final_booking_copy_does_not_repeat_the_brand_name(self):
        self.assertNotIn("Reserva tu hora con Evolution Studio", HTML)


if __name__ == "__main__":
    unittest.main()

"""Ningún secreto real puede llegar a un archivo versionado.

Los patrones de abajo describen la FORMA de cada credencial, nunca un valor
concreto: así el test detecta una fuga sin convertirse él mismo en la fuga.
"""

import json
from pathlib import Path
import re
import subprocess
import unittest


ROOT = Path(__file__).parents[1]

# Variables que el Worker necesita en runtime. Deben estar documentadas por
# nombre en .dev.vars.example, siempre con placeholder.
REQUIRED_VARS = (
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
    "BARBER_A_CALENDAR_ID",
    "BARBER_B_CALENDAR_ID",
    "BARBER_A_EMAIL",
    "BARBER_B_EMAIL",
    "OWNER_EMAIL",
)

# Forma de cada credencial real de Google, sin incluir ningún valor.
SECRET_SHAPES = {
    "calendar_id real de Google": re.compile(r"[0-9a-f]{40,}@group\.calendar\.google\.com"),
    "client_id de OAuth": re.compile(r"\d{6,}-[0-9a-z]{20,}\.apps\.googleusercontent\.com"),
    "client_secret de Google": re.compile(r"GOCSPX-[\w-]{10,}"),
    "refresh_token de Google": re.compile(r"\b1//[\w-]{20,}"),
}


def tracked_files():
    result = subprocess.run(
        ["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True
    )
    return [line for line in result.stdout.splitlines() if line]


class SecretsHygieneTests(unittest.TestCase):
    def test_dev_vars_is_ignored_and_never_tracked(self):
        tracked = subprocess.run(
            ["git", "ls-files", ".dev.vars"], cwd=ROOT, capture_output=True, text=True, check=True
        )
        self.assertEqual(tracked.stdout.strip(), "")

        ignored = subprocess.run(
            ["git", "check-ignore", ".dev.vars"], cwd=ROOT, capture_output=True, text=True
        )
        self.assertEqual(ignored.returncode, 0, ".dev.vars debe estar ignorado por Git")

    def test_the_example_file_is_tracked_and_lists_every_required_variable(self):
        example = ROOT / ".dev.vars.example"
        self.assertTrue(example.is_file())
        self.assertIn(".dev.vars.example", tracked_files())

        text = example.read_text()
        for name in REQUIRED_VARS:
            with self.subTest(name=name):
                self.assertRegex(text, rf"(?m)^{name}=", msg=f"falta {name}")

    def test_no_tracked_file_contains_a_real_google_credential(self):
        offenders = []
        for relative in tracked_files():
            path = ROOT / relative
            try:
                content = path.read_text(errors="ignore")
            except (OSError, UnicodeDecodeError):
                continue
            for label, pattern in SECRET_SHAPES.items():
                if pattern.search(content):
                    offenders.append(f"{relative}: parece contener un {label}")
        self.assertEqual(offenders, [], "\n".join(offenders))

    def test_the_patterns_catch_a_credential_even_when_it_reads_as_fake(self):
        """La guarda no interpreta el contenido para decidir si algo es real.

        Una credencial que contenga la palabra "fake" debe detectarse igual:
        decidir lo contrario abriría una vía de evasión trivial. Las muestras
        se ensamblan en runtime porque escribirlas literalmente haría que el
        barrido de arriba fallara sobre este mismo archivo — que es
        exactamente la propiedad que se está comprobando.
        """
        sufijo_cal = "@" + ".".join(["group", "calendar", "google", "com"])
        sufijo_id = "." + ".".join(["apps", "googleusercontent", "com"])
        muestras = {
            "calendar_id real de Google": "fake" + "a" * 60 + sufijo_cal,
            "client_id de OAuth": "123456789" + "-" + "fake" + "a" * 20 + sufijo_id,
            "client_secret de Google": "GOCSPX" + "-" + "fake" + "A" * 12,
            "refresh_token de Google": "1" + "//" + "fake" + "B" * 24,
        }

        for label, muestra in muestras.items():
            with self.subTest(label=label):
                self.assertRegex(muestra, SECRET_SHAPES[label])

    def test_a_harmless_string_does_not_trip_the_patterns(self):
        # Sin esto, un patrón demasiado laxo pasaría inadvertido.
        inocuo = "reemplazar-con-el-client-id-de-escritorio y un correo@example.com"
        for label, pattern in SECRET_SHAPES.items():
            with self.subTest(label=label):
                self.assertIsNone(pattern.search(inocuo))


class WranglerConfigTests(unittest.TestCase):
    """La configuración declara los secretos por nombre y jamás por valor."""

    EXPECTED_SECRETS = list(REQUIRED_VARS)
    EXPECTED_VARS = {"BUSINESS_TIMEZONE": "America/Santiago", "MIN_ADVANCE_MIN": "0"}

    @classmethod
    def setUpClass(cls):
        raw = ROOT.joinpath("wrangler.jsonc").read_text()
        # Los comentarios de este archivo ocupan siempre la línea completa.
        sin_comentarios = "\n".join(
            line for line in raw.splitlines() if not line.strip().startswith("//")
        )
        cls.config = json.loads(sin_comentarios)

    def test_declares_exactly_the_eight_required_secrets(self):
        required = self.config.get("secrets", {}).get("required")
        self.assertIsNotNone(required, "falta secrets.required en wrangler.jsonc")
        self.assertEqual(required, self.EXPECTED_SECRETS)
        self.assertEqual(len(required), 8)
        self.assertEqual(len(set(required)), 8, "hay nombres duplicados")

    def test_declares_the_public_vars_and_nothing_else(self):
        self.assertEqual(self.config.get("vars"), self.EXPECTED_VARS)

    def test_no_secret_name_is_also_declared_as_a_public_var(self):
        required = set(self.config.get("secrets", {}).get("required", []))
        overlap = required & set(self.config.get("vars", {}))
        self.assertEqual(overlap, set(), f"declarados dos veces: {overlap}")

    def test_the_config_carries_no_real_values(self):
        raw = ROOT.joinpath("wrangler.jsonc").read_text()
        for label, pattern in SECRET_SHAPES.items():
            with self.subTest(label=label):
                self.assertIsNone(pattern.search(raw))
        # secrets.required son nombres, nunca pares nombre=valor.
        for name in self.config["secrets"]["required"]:
            self.assertNotIn(f"{name}=", raw)


if __name__ == "__main__":
    unittest.main()

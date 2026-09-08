"""Ningún secreto real puede llegar a un archivo versionado.

Los patrones de abajo describen la FORMA de cada credencial, nunca un valor
concreto: así el test detecta una fuga sin convertirse él mismo en la fuga.
"""

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


if __name__ == "__main__":
    unittest.main()

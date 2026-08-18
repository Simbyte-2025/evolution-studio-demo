import json
from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).parents[1]


class SitesBuildTests(unittest.TestCase):
    def test_build_emits_worker_that_serves_the_landing_assets_and_404(self):
        build = subprocess.run(
            ["npm", "run", "build"],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(
            build.returncode,
            0,
            msg=f"build failed:\n{build.stdout}\n{build.stderr}",
        )

        probe = """
          const worker = (await import('./dist/server/index.js')).default;
          const request = (path) => worker.fetch(new Request(`https://demo.test${path}`));
          const home = await request('/');
          const homeText = await home.text();
          const logo = await request('/assets/reference/evolution-logo-instagram.jpeg');
          const favicon = await request('/favicon.ico');
          const missing = await request('/no-existe');
          console.log(JSON.stringify({
            homeStatus: home.status,
            hasTitle: homeText.includes('Evolution Studio | Quinta de Tilcoco'),
            logoStatus: logo.status,
            logoType: logo.headers.get('content-type'),
            faviconStatus: favicon.status,
            missingStatus: missing.status,
          }));
        """
        run = subprocess.run(
            ["node", "--input-type=module", "--eval", probe],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(
            run.returncode,
            0,
            msg=f"worker probe failed:\n{run.stdout}\n{run.stderr}",
        )
        self.assertEqual(
            json.loads(run.stdout),
            {
                "homeStatus": 200,
                "hasTitle": True,
                "logoStatus": 200,
                "logoType": "image/jpeg",
                "faviconStatus": 200,
                "missingStatus": 404,
            },
        )


if __name__ == "__main__":
    unittest.main()

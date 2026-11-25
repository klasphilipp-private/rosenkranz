import subprocess
import io
import stat
import unittest
from pathlib import Path

from scripts.release_files import manifest_bytes, public_files, release_manifest, verify_remote_files


ROOT = Path(__file__).resolve().parents[1]


class ReleaseFilesTests(unittest.TestCase):
    def test_public_allowlist_excludes_source_and_unapproved_maintenance(self):
        dev = public_files(ROOT, include_maintenance=True)
        prod = public_files(ROOT, include_maintenance=False)
        self.assertIn(Path("index.html"), dev)
        self.assertIn(Path("forms-config.json"), prod)
        self.assertTrue(any(path.parts[0] == "wartung" for path in dev))
        self.assertFalse(any(path.parts[0] == "wartung" for path in prod))
        self.assertFalse(any(path.parts[0] == "workers" for path in dev))
        self.assertFalse(any(path.parts[0] == "scripts" for path in dev))

    def test_manifest_is_stable_and_records_file_content(self):
        sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
        files = [Path("index.html"), Path("forms-config.json")]
        first = release_manifest(ROOT, files, sha)
        self.assertEqual(manifest_bytes(first), manifest_bytes(release_manifest(ROOT, files, sha)))
        self.assertEqual(first["files"]["index.html"]["bytes"], (ROOT / "index.html").stat().st_size)

    def test_remote_verification_detects_corrupted_content_of_same_size(self):
        sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
        manifest = release_manifest(ROOT, [Path("forms-config.json")], sha)
        original = (ROOT / "forms-config.json").read_bytes()

        class Remote:
            def lstat(self, name):
                return type("Info", (), {"st_mode": stat.S_IFREG, "st_size": len(original)})()

            def open(self, name, mode):
                return io.BytesIO(b"X" + original[1:])

        with self.assertRaisesRegex(RuntimeError, "checksum differs"):
            verify_remote_files(Remote(), manifest)


if __name__ == "__main__":
    unittest.main()

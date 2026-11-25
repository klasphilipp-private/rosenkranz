import unittest

from scripts.htaccess_hardening import END, START, merge


class HtaccessHardeningTests(unittest.TestCase):
    def test_preserves_password_protection_and_is_idempotent(self):
        existing = b'AuthType Basic\nAuthName "Private"\nAuthUserFile /private/htpasswd\nRequire valid-user\n'
        hardened = merge(existing)
        self.assertIn(existing.rstrip(), hardened)
        self.assertIn(b"Require all denied", hardened)
        self.assertIn(b"X-Robots-Tag", hardened)
        self.assertEqual(hardened, merge(hardened))

    def test_replaces_only_managed_block(self):
        existing = b"AuthType Basic\n" + START + b"\nold rules\n" + END + b"\nRequire valid-user\n"
        hardened = merge(existing)
        self.assertIn(b"AuthType Basic", hardened)
        self.assertIn(b"Require valid-user", hardened)
        self.assertIn(b"AuthType Basic\nRequire valid-user", hardened)
        self.assertNotIn(b"old rules", hardened)

    def test_rejects_incomplete_block(self):
        with self.assertRaises(ValueError):
            merge(b"AuthType Basic\n" + START)


if __name__ == "__main__":
    unittest.main()

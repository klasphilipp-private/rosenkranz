import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from deploy_prod_preview import START, configured, router  # noqa: E402


class ProdPreviewRouterTests(unittest.TestCase):
    def test_atomic_router_points_to_immutable_release_without_noindex(self):
        release = "a" * 40
        rules = router(release)
        self.assertIn(f"__releases/{release}/$1".encode(), rules)
        self.assertIn(b"RewriteRule ^__releases/ - [L]", rules)
        self.assertNotIn(b"noindex", rules)
        self.assertNotIn(b"AuthType", rules)

    def test_switch_replaces_only_managed_router(self):
        first = configured(None, "a" * 40)
        second = configured(first, "b" * 40)
        self.assertEqual(second.count(START), 1)
        self.assertNotIn(b"a" * 40, second)
        self.assertIn(b"b" * 40, second)

    def test_unmanaged_access_file_is_never_overwritten(self):
        with self.assertRaises(RuntimeError):
            configured(b"Require valid-user\n", "a" * 40)


if __name__ == "__main__":
    unittest.main()

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from deploy_prod_preview import START, configured, release_plan, router  # noqa: E402


class ProdPreviewRouterTests(unittest.TestCase):
    def test_atomic_router_points_to_immutable_release_without_noindex(self):
        release = "a" * 40
        rules = router(release)
        self.assertIn(f"__releases/{release}/$1".encode(), rules)
        self.assertIn(b"RewriteBase /", rules)
        self.assertIn(b"RewriteRule ^__releases/ - [END]", rules)
        self.assertIn(b"RewriteCond %{HTTP_HOST} ^www\\.automobile-rosenkranz\\.de$ [NC]", rules)
        self.assertIn(b"RewriteCond %{HTTP_HOST} ^automobile-rosenkranz\\.de$ [NC]", rules)
        self.assertIn(b"RewriteCond %{HTTPS} !=on", rules)
        self.assertEqual(rules.count(b"RewriteRule ^ https://automobile-rosenkranz.de%{REQUEST_URI} [R=301,L,NE]"), 2)
        self.assertIn(f"RewriteRule ^(.*)$ __releases/{release}/$1 [END]".encode(), rules)
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

    def test_delta_keeps_unchanged_files_in_original_release(self):
        base, new = "a" * 40, "b" * 40
        prior = {"sourceCommit": base, "files": {"index.html": {"sha256": "old"}, "style.css": {"sha256": "same"}}}
        current = {"files": {"index.html": {"sha256": "new"}, "style.css": {"sha256": "same"}}}
        base_release, sources, deleted, changed = release_plan(prior, current, new)
        self.assertEqual((base_release, sources, deleted, changed), (base, {"index.html": new}, [], ["index.html"]))
        rules = router(new, base=base_release, sources=sources, deleted=deleted)
        self.assertIn(f"RewriteRule ^$ __releases/{new}/index.html [END]".encode(), rules)
        self.assertIn(f"RewriteRule ^(.*)$ __releases/{base}/$1 [END]".encode(), rules)
        self.assertNotIn(f"__releases/{new}/style.css".encode(), rules)

    def test_deleted_detail_page_is_gone_even_if_it_exists_in_base(self):
        base, new = "a" * 40, "b" * 40
        path = "angebote/auto/index.html"
        prior = {"sourceCommit": base, "files": {"index.html": {"sha256": "same"}, path: {"sha256": "old"}}}
        current = {"files": {"index.html": {"sha256": "same"}}}
        base_release, sources, deleted, changed = release_plan(prior, current, new)
        self.assertEqual((changed, deleted), ([], [path]))
        rules = router(new, base=base_release, sources=sources, deleted=deleted)
        self.assertIn(b"RewriteRule ^angebote/auto/?$ - [G]", rules)
        self.assertIn(b"RewriteRule ^angebote/auto/index\\.html$ - [G]", rules)

    def test_new_detail_page_routes_directory_and_file_to_overlay(self):
        base, new = "a" * 40, "b" * 40
        path = "angebote/neues-auto/index.html"
        prior = {"sourceCommit": base, "files": {"index.html": {"sha256": "same"}}}
        current = {"files": {"index.html": {"sha256": "same"}, path: {"sha256": "new"}}}
        base_release, sources, deleted, changed = release_plan(prior, current, new)
        rules = router(new, base=base_release, sources=sources, deleted=deleted)
        self.assertEqual(changed, [path])
        self.assertIn(f"RewriteRule ^angebote/neues\\-auto/?$ __releases/{new}/{path} [END]".encode(), rules)

    def test_second_delta_preserves_prior_overlay_and_tombstones(self):
        base, middle, new = "a" * 40, "b" * 40, "c" * 40
        prior = {"sourceCommit": middle, "baseRelease": base,
                 "files": {"index.html": {"sha256": "same"}, "style.css": {"sha256": "changed"}},
                 "fileSources": {"style.css": middle}, "deletedPaths": ["old.html"]}
        current = {"files": {"index.html": {"sha256": "same"}, "style.css": {"sha256": "changed"}}}
        self.assertEqual(release_plan(prior, current, new), (base, {"style.css": middle}, ["old.html"], []))


if __name__ == "__main__":
    unittest.main()

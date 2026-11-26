import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "sync-mobile-inventory.py"
spec = importlib.util.spec_from_file_location("sync_mobile_inventory", MODULE_PATH)
mobile = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mobile)


class MobileRefreshTests(unittest.TestCase):
    def test_unchanged_ad_reuses_details_and_zero_active_ads_removes_page(self):
        ad = {
            "mobileAdId": "12345", "modificationDate": "2026-11-26T10:00:00+01:00",
            "make": "CITROEN", "model": "C3", "modelDescription": "C3 Max",
            "detailPageUrl": "https://suchen.mobile.de/auto-inserat/example/12345.html",
            "images": [{"xxl": "https://img.classistatic.de/example.jpg"}],
            "price": {"consumerPriceGross": "15000"},
        }
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "inventory.json"
            with patch.object(mobile, "DESTINATION", target), patch.dict(os.environ, {"MOBILE_API_USERNAME": "test", "MOBILE_API_PASSWORD": "test"}):
                with patch.object(mobile, "fetch_page", return_value={"total": 1, "maxPages": 1, "ads": [ad]}), \
                     patch.object(mobile, "fetch_ad_detail", return_value={"plainTextDescription": "Ein gutes Auto"}) as detail:
                    mobile.main()
                    detail.assert_called_once()
                first = json.loads(target.read_text())
                page = Path(directory) / first["vehicles"][0]["detailPath"] / "index.html"
                self.assertTrue(page.is_file())

                with patch.object(mobile, "fetch_page", return_value={"total": 1, "maxPages": 1, "ads": [ad]}), \
                     patch.object(mobile, "fetch_ad_detail", side_effect=AssertionError("unchanged ad must not be downloaded")):
                    mobile.main()
                second = json.loads(target.read_text())
                self.assertEqual(first, second)

                with patch.object(mobile, "fetch_page", return_value={"total": 0, "maxPages": 1, "ads": []}):
                    mobile.main()
                self.assertEqual(json.loads(target.read_text())["vehicles"], [])
                self.assertFalse(page.exists())


if __name__ == "__main__":
    unittest.main()

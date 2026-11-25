import os
import socket
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch

from scripts.probe_prod_preview_binding import check_binding


class LocalSftp:
    def __init__(self, directory):
        self.directory = Path(directory)

    def open(self, name, mode):
        return (self.directory / name).open(mode)

    def remove(self, name):
        (self.directory / name).unlink()

    def lstat(self, name):
        return os.lstat(self.directory / name)


class PreviewBindingTests(unittest.TestCase):
    def test_matching_https_bytes_and_cleanup(self):
        with tempfile.TemporaryDirectory() as directory:
            content = b"unique probe content"

            class Response:
                status = 200
                headers = {}

                def __enter__(self):
                    return self

                def __exit__(self, *args):
                    return False

                def read(self, maximum):
                    return content

            with patch("urllib.request.urlopen", return_value=Response()):
                check_binding(LocalSftp(directory), "probe.txt", content)
            self.assertFalse((Path(directory) / "probe.txt").exists())

    def test_http_failure_still_removes_probe(self):
        with tempfile.TemporaryDirectory() as directory:
            failure = urllib.error.HTTPError("https://example.invalid", 404, "Not Found", {}, None)
            with patch("urllib.request.urlopen", side_effect=failure):
                with self.assertRaisesRegex(RuntimeError, "HTTP 404"):
                    check_binding(LocalSftp(directory), "probe.txt", b"content")
            self.assertFalse((Path(directory) / "probe.txt").exists())

    def test_dns_failure_reports_clear_error_and_removes_probe(self):
        with tempfile.TemporaryDirectory() as directory:
            failure = urllib.error.URLError(socket.gaierror(-2, "Name or service not known"))
            with patch("urllib.request.urlopen", side_effect=failure):
                with self.assertRaisesRegex(RuntimeError, "does not resolve in DNS"):
                    check_binding(LocalSftp(directory), "probe.txt", b"content")
            self.assertFalse((Path(directory) / "probe.txt").exists())


if __name__ == "__main__":
    unittest.main()

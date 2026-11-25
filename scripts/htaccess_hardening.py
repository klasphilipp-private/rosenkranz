"""Idempotently add DEV_TEST-only Apache rules without replacing Basic Auth."""

from pathlib import Path


START = b"# BEGIN ROSENKRANZ DEV_TEST HARDENING"
END = b"# END ROSENKRANZ DEV_TEST HARDENING"
RULES = Path(__file__).resolve().parents[1] / "deploy" / "dev-test-hardening.htaccess"


def merge(existing: bytes, rules: bytes | None = None) -> bytes:
    if rules is None:
        rules = RULES.read_bytes()
    if existing.count(START) != existing.count(END) or existing.count(START) > 1:
        raise ValueError("Incomplete or duplicated managed .htaccess block")
    if START in existing:
        before, rest = existing.split(START, 1)
        _, after = rest.split(END, 1)
        existing = before.rstrip(b"\r\n") + b"\n" + after.lstrip(b"\r\n")
    return existing.rstrip(b"\r\n") + b"\n\n" + START + b"\n" + rules.rstrip(b"\r\n") + b"\n" + END + b"\n"

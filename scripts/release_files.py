"""Single allowlist and checksums for the Rosenkranz website releases."""

import hashlib
import json
import re
import stat
import subprocess
from pathlib import Path


PUBLIC_TYPES = {
    ".html", ".css", ".js", ".mjs", ".png", ".jpg", ".jpeg",
    ".gif", ".webp", ".avif", ".svg", ".ico", ".woff", ".woff2",
    ".ttf", ".mp4", ".webm", ".pdf",
}
PUBLIC_DATA = {
    "models.json", "inventory.json", "google-reviews.json",
    "forms-config.json", "robots.txt", "sitemap.xml",
}
EXCLUDED_ROOTS = {"scripts", "docs", "tests", "deploy", "workers"}
AUTO_DATA_FILES = {"inventory.json", "google-reviews.json", "sitemap.xml"}


def auto_data_file(name: str) -> bool:
    """Only these generated public files may bypass manual content approval."""
    return name in AUTO_DATA_FILES or bool(re.fullmatch(r"angebote/[a-z0-9-]+/index\.html", name))


def public_files(source: Path, *, include_maintenance: bool) -> list[Path]:
    source = source.resolve()
    names = subprocess.check_output(["git", "-C", str(source), "ls-files", "-z"]).decode().split("\0")
    files = []
    for name in names:
        if not name:
            continue
        path = Path(name)
        if any(part.startswith(".") for part in path.parts) or path.parts[0] in EXCLUDED_ROOTS:
            continue
        if not include_maintenance and path.parts[0] == "wartung":
            continue
        absolute = source / path
        if absolute.is_file() and not absolute.is_symlink() and (
            path.suffix.lower() in PUBLIC_TYPES or name in PUBLIC_DATA
        ):
            files.append(path)
    if Path("index.html") not in files or Path("forms-config.json") not in files:
        raise ValueError("Website entry point or form configuration missing")
    return sorted(files)


def release_manifest(source: Path, files: list[Path], sha: str) -> dict:
    if len(sha) != 40 or any(char not in "0123456789abcdef" for char in sha):
        raise ValueError("Expected a full lowercase Git commit SHA")
    entries = {}
    for path in files:
        digest = hashlib.sha256()
        with (source / path).open("rb") as file:
            while chunk := file.read(1024 * 1024):
                digest.update(chunk)
        entries[path.as_posix()] = {"sha256": digest.hexdigest(), "bytes": (source / path).stat().st_size}
    manifest = {"schemaVersion": 1, "sourceCommit": sha, "files": entries}
    manifest["contentDigest"] = hashlib.sha256(
        json.dumps(entries, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    return manifest


def manifest_bytes(manifest: dict) -> bytes:
    return (json.dumps(manifest, sort_keys=True, separators=(",", ":")) + "\n").encode()


def file_delta(previous: dict | None, current: dict) -> tuple[list[str], list[str]]:
    """Compare recorded checksums; unchanged files need no SFTP transfer."""
    old = previous.get("files", {}) if previous else {}
    new = current["files"]
    return (
        sorted(name for name, metadata in new.items() if old.get(name) != metadata),
        sorted(set(old) - set(new)),
    )


def selected_manifest(manifest: dict, names: list[str]) -> dict:
    """Use the existing byte verification for only the uploaded files."""
    return {**manifest, "files": {name: manifest["files"][name] for name in names}}


def verify_remote_files(sftp, manifest: dict) -> None:
    """Check every file listed in the supplied (possibly selected) manifest."""
    for count, (name, metadata) in enumerate(manifest["files"].items(), 1):
        info = sftp.lstat(name)
        if not stat.S_ISREG(info.st_mode) or info.st_size != metadata["bytes"]:
            raise RuntimeError(f"Remote release file differs: {name}")
        digest = hashlib.sha256()
        with sftp.open(name, "rb") as file:
            if metadata["bytes"] >= 1024 * 1024:
                file.prefetch(file_size=metadata["bytes"], max_concurrent_requests=16)
            while chunk := file.read(1024 * 1024):
                digest.update(chunk)
        if digest.hexdigest() != metadata["sha256"]:
            raise RuntimeError(f"Remote release checksum differs: {name}")
        if count % 50 == 0:
            print(f"Verified {count}/{len(manifest['files'])} release files", flush=True)

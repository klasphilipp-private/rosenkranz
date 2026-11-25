"""Atomically publish an approved static release in the PROD preview directory.

The IONOS document root stays fixed. Apache serves one immutable release folder,
selected by an atomically replaced .htaccess file. On a failed HTTP check the
previous routing file is restored; old release folders remain for rollback.
"""

import json
import os
import re
import stat
import tempfile
import urllib.request
from pathlib import Path

from release_files import manifest_bytes, release_manifest, verify_remote_files


PREVIEW = "https://prd-prev.automobile-rosenkranz.de"
START = b"# BEGIN ROSENKRANZ RELEASE ROUTER"
END = b"# END ROSENKRANZ RELEASE ROUTER"


def router(sha):
    if not re.fullmatch(r"[0-9a-f]{40}|probe-[0-9]+", sha):
        raise ValueError("Invalid release identifier")
    return f"""# BEGIN ROSENKRANZ RELEASE ROUTER
RewriteEngine On
RewriteRule ^__releases/ - [L]
RewriteRule ^(.*)$ __releases/{sha}/$1 [L]
<FilesMatch \"(?i)(?:^\\.|\\.(?:php[0-9]?|phtml|phar|cgi|pl|py|sh|asp|aspx|jsp|sql|sqlite|ini|conf|ya?ml|toml|env|log|pem|key|bak|old|orig|save)$)\">
    Require all denied
</FilesMatch>
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options \"nosniff\"
    Header always set X-Frame-Options \"DENY\"
    Header always set Referrer-Policy \"strict-origin-when-cross-origin\"
</IfModule>
# END ROSENKRANZ RELEASE ROUTER
""".encode()


def configured(existing, sha):
    if existing is None:
        existing = b""
    if START in existing or END in existing:
        if existing.count(START) != 1 or existing.count(END) != 1:
            raise RuntimeError("PROD .htaccess has an incomplete release router")
        before, remainder = existing.split(START, 1)
        _, after = remainder.split(END, 1)
        existing = before.rstrip(b"\r\n") + b"\n" + after.lstrip(b"\r\n")
    elif existing.strip():
        raise RuntimeError("Unmanaged PROD .htaccess exists; refusing to replace it")
    return existing.rstrip(b"\r\n") + b"\n" + router(sha)


def replace_access(sftp, data):
    temporary = f".htaccess.codex-{os.environ['GITHUB_RUN_ID']}.tmp"
    try:
        if data is None:
            try:
                sftp.remove(".htaccess")
            except FileNotFoundError:
                pass
        else:
            with sftp.open(temporary, "wb") as file:
                file.write(data)
            sftp.posix_rename(temporary, ".htaccess")
    finally:
        try:
            sftp.remove(temporary)
        except FileNotFoundError:
            pass


def http_bytes(path):
    request = urllib.request.Request(PREVIEW + path, headers={"Cache-Control": "no-store"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status, response.headers, response.read(), response.geturl()


def main():
    import paramiko

    ROOT = Path(os.environ["PROD_BUILD_DIR"]).resolve()
    SHA = os.environ["APPROVED_SHA"]
    if not ROOT.is_dir() or not re.fullmatch(r"[0-9a-f]{40}", SHA):
        raise RuntimeError("Production package or approved commit is invalid")
    files = sorted(path.relative_to(ROOT) for path in ROOT.rglob("*") if path.is_file())
    if not files or Path("index.html") not in files or any((ROOT / path).is_symlink() or any(part.startswith(".") for part in path.parts) for path in files):
        raise RuntimeError("Production package contains missing or unexpected files")
    manifest = release_manifest(ROOT, files, SHA)
    required = ("IONOS_SFTP_HOST", "IONOS_SFTP_PORT", "IONOS_SFTP_KNOWN_HOSTS", "IONOS_PROD_SFTP_USERNAME", "IONOS_PROD_SFTP_PASSWORD", "IONOS_PROD_REMOTE_PATH")
    if any(not os.environ.get(name, "").strip() for name in required):
        raise RuntimeError("PROD SFTP configuration is incomplete")

    with tempfile.NamedTemporaryFile(mode="w") as known, paramiko.SSHClient() as ssh:
        known.write(os.environ["IONOS_SFTP_KNOWN_HOSTS"].rstrip() + "\n")
        known.flush()
        ssh.load_host_keys(known.name)
        ssh.set_missing_host_key_policy(paramiko.RejectPolicy())
        ssh.connect(os.environ["IONOS_SFTP_HOST"], port=int(os.environ["IONOS_SFTP_PORT"]),
                    username=os.environ["IONOS_PROD_SFTP_USERNAME"], password=os.environ["IONOS_PROD_SFTP_PASSWORD"],
                    allow_agent=False, look_for_keys=False, timeout=15, banner_timeout=15, auth_timeout=15)
        with ssh.open_sftp() as sftp:
            sftp.get_channel().settimeout(45)
            sftp.chdir(os.environ["IONOS_PROD_REMOTE_PATH"])
            entries = set(sftp.listdir("."))
            try:
                with sftp.open(".htaccess", "rb") as file:
                    previous = file.read()
            except FileNotFoundError:
                previous = None
            first_release = previous is None
            if first_release and entries:
                raise RuntimeError("PROD preview directory is not empty; refusing first release")
            if not first_release:
                if START not in previous or ".rosenkranz-prod-release.json" not in entries:
                    raise RuntimeError("Existing PROD release is not managed by this workflow")
                with sftp.open(".rosenkranz-prod-release.json", "rb") as file:
                    prior = json.load(file)
                if prior.get("sourceCommit", "").encode() not in previous:
                    raise RuntimeError("PROD release marker and active router disagree")

            sftp.mkdir("__releases") if "__releases" not in entries else None
            if first_release:
                probe = f"probe-{os.environ['GITHUB_RUN_ID']}"
                probe_file = f"codex-rewrite-{os.environ['GITHUB_RUN_ID']}.txt"
                sftp.mkdir(f"__releases/{probe}")
                try:
                    with sftp.open(f"__releases/{probe}/{probe_file}", "wb") as file:
                        file.write(b"rosenkranz-rewrite-ok")
                    with sftp.open(f"__releases/{probe}/index.html", "wb") as file:
                        file.write(b"rosenkranz-root-ok")
                    replace_access(sftp, configured(previous, probe))
                    status, _, body, _ = http_bytes("/" + probe_file)
                    if status != 200 or body != b"rosenkranz-rewrite-ok":
                        raise RuntimeError("IONOS did not serve the release router correctly")
                    status, _, body, final_url = http_bytes("/")
                    if status != 200 or body != b"rosenkranz-root-ok" or final_url.rstrip("/") != PREVIEW:
                        raise RuntimeError("IONOS did not serve the release root correctly")
                    print("IONOS release router probe passed; temporary router will be removed.", flush=True)
                finally:
                    replace_access(sftp, previous)
                    for name in (probe_file, "index.html"):
                        try:
                            sftp.remove(f"__releases/{probe}/{name}")
                        except FileNotFoundError:
                            pass
                    sftp.rmdir(f"__releases/{probe}")

            release = f"__releases/{SHA}"
            if SHA in sftp.listdir("__releases"):
                raise RuntimeError("Release folder already exists; refusing to mix files")
            sftp.mkdir(release)
            with sftp.open(f"{release}/.uploading", "wb") as file:
                file.write(b"incomplete")
            for directory in sorted({parent.as_posix() for path in files for parent in path.parents} - {"."}, key=lambda value: (value.count("/"), value)):
                sftp.mkdir(f"{release}/{directory}")
            for count, path in enumerate(files, 1):
                sftp.put(str(ROOT / path), f"{release}/{path.as_posix()}", confirm=True)
                if count % 50 == 0:
                    print(f"Uploaded {count}/{len(files)} production files", flush=True)
            sftp.chdir(release)
            verify_remote_files(sftp, manifest)
            sftp.remove(".uploading")
            sftp.chdir(os.environ["IONOS_PROD_REMOTE_PATH"])
            print(f"Staged and verified {len(files)} files for {SHA}.", flush=True)

            try:
                replace_access(sftp, configured(previous, SHA))
                status, headers, index, _ = http_bytes("/index.html")
                if status != 200 or index != (ROOT / "index.html").read_bytes():
                    raise RuntimeError("PROD preview index does not match the approved package")
                if "noindex" in headers.get("X-Robots-Tag", "").lower():
                    raise RuntimeError("PROD preview unexpectedly sends a noindex header")
                status, _, home, final_url = http_bytes("/")
                if status != 200 or home != index or final_url.rstrip("/") != PREVIEW:
                    raise RuntimeError("PROD preview homepage does not serve the approved package")
                representative = next((path.as_posix() for path in files if len(path.parts) == 3 and path.parts[0] == "angebote" and path.name == "index.html"), None)
                for name in ("modelle.html", "robots.txt", "forms-config.json", representative):
                    if name is None:
                        continue
                    status, _, body, _ = http_bytes("/" + name)
                    if status != 200 or body != (ROOT / name).read_bytes():
                        raise RuntimeError(f"PROD preview {name} does not match the approved package")
                temporary = f".rosenkranz-prod-release.json.{os.environ['GITHUB_RUN_ID']}.tmp"
                with sftp.open(temporary, "wb") as file:
                    file.write(manifest_bytes(manifest))
                sftp.posix_rename(temporary, ".rosenkranz-prod-release.json")
            except Exception:
                replace_access(sftp, previous)
                raise
            print(f"PROD preview published: {SHA} / {manifest['contentDigest']}", flush=True)


if __name__ == "__main__":
    main()

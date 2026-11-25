"""Prove that the configured PROD SFTP directory serves the preview hostname."""

import base64
import errno
import os
import secrets
import socket
import tempfile
import urllib.error
import urllib.request

PREVIEW = "https://prd-prv.automobile-rosenkranz.de"


def check_binding(sftp, marker, content, user="", password=""):
    written = False
    try:
        with sftp.open(marker, "wb") as file:
            written = True
            file.write(content)
        with sftp.open(marker, "rb") as file:
            if file.read() != content:
                raise RuntimeError("SFTP read-back differs from probe content")

        request = urllib.request.Request(f"{PREVIEW}/{marker}", headers={"Cache-Control": "no-store"})
        if user:
            credentials = base64.b64encode(f"{user}:{password}".encode()).decode()
            request.add_header("Authorization", "Basic " + credentials)
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                status, received = response.status, response.read(256)
        except urllib.error.HTTPError as error:
            if error.code == 401 and not user:
                raise RuntimeError("PROD preview requires Basic Auth; add PROD_PREVIEW_USER/PASSWORD as Actions secrets") from None
            raise RuntimeError(f"PROD preview returned HTTP {error.code}; SFTP-to-domain binding is unverified") from None
        except urllib.error.URLError as error:
            if isinstance(error.reason, socket.gaierror):
                raise RuntimeError("PROD preview hostname does not resolve in DNS; SFTP-to-domain binding is unverified") from None
            raise RuntimeError(f"PROD preview network or TLS request failed ({type(error.reason).__name__})") from None
        if status != 200 or received != content:
            raise RuntimeError("PROD preview did not serve the exact SFTP probe bytes")
        print("Verified: PROD SFTP target serves the exact bytes through the HTTPS preview hostname.")
    finally:
        if written:
            sftp.remove(marker)
            try:
                sftp.lstat(marker)
            except OSError as error:
                if error.errno != errno.ENOENT:
                    raise
                print("Temporary binding probe removed from PROD SFTP directory.")
            else:
                raise RuntimeError("Temporary binding probe still exists after deletion")


def main():
    import paramiko

    required = (
        "IONOS_SFTP_HOST", "IONOS_SFTP_PORT", "IONOS_SFTP_KNOWN_HOSTS",
        "IONOS_PROD_SFTP_USERNAME", "IONOS_PROD_SFTP_PASSWORD", "IONOS_PROD_REMOTE_PATH",
    )
    for name in required:
        if not os.environ.get(name, "").strip():
            raise RuntimeError(f"Missing configuration: {name}")
    user = os.environ.get("PROD_PREVIEW_USER", "")
    password = os.environ.get("PROD_PREVIEW_PASSWORD", "")
    if bool(user) != bool(password):
        raise RuntimeError("Both PROD_PREVIEW_USER and PROD_PREVIEW_PASSWORD are required for Basic Auth")

    marker = f"codex-binding-check-{os.environ['GITHUB_RUN_ID']}-{secrets.token_hex(6)}.txt"
    content = secrets.token_urlsafe(32).encode()
    with tempfile.NamedTemporaryFile(mode="w") as known_hosts, paramiko.SSHClient() as ssh:
        known_hosts.write(os.environ["IONOS_SFTP_KNOWN_HOSTS"].rstrip() + "\n")
        known_hosts.flush()
        ssh.load_host_keys(known_hosts.name)
        ssh.set_missing_host_key_policy(paramiko.RejectPolicy())
        ssh.connect(
            hostname=os.environ["IONOS_SFTP_HOST"],
            port=int(os.environ["IONOS_SFTP_PORT"]),
            username=os.environ["IONOS_PROD_SFTP_USERNAME"],
            password=os.environ["IONOS_PROD_SFTP_PASSWORD"],
            allow_agent=False, look_for_keys=False,
            timeout=15, banner_timeout=15, auth_timeout=15,
        )
        with ssh.open_sftp() as sftp:
            sftp.get_channel().settimeout(30)
            sftp.chdir(os.environ["IONOS_PROD_REMOTE_PATH"])
            print("Configured PROD SFTP directory is accessible.", flush=True)
            check_binding(sftp, marker, content, user, password)


if __name__ == "__main__":
    main()

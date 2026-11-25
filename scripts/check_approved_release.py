"""Verify that the approved Git commit is exactly the deployed DEV_TEST release."""

import os
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

import paramiko

from release_files import manifest_bytes, public_files, release_manifest, selected_manifest, verify_remote_files


def verify_http_protection():
    request = urllib.request.Request("https://test1.automobile-rosenkranz.de/", method="HEAD")
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            status, headers = response.status, response.headers
    except urllib.error.HTTPError as error:
        status, headers = error.code, error.headers
    if status != 401 or headers.get("X-Robots-Tag") != "noindex, nofollow, noarchive":
        raise RuntimeError("DEV_TEST password protection or noindex header is missing")


def verify_sftp_release():
    source = Path.cwd()
    sha = os.environ["APPROVED_SHA"]
    expected = release_manifest(source, public_files(source, include_maintenance=True), sha)
    verify_http_protection()
    with tempfile.NamedTemporaryFile(mode="w") as known_hosts, paramiko.SSHClient() as ssh:
        known_hosts.write(os.environ["SFTP_KNOWN_HOSTS"].rstrip() + "\n")
        known_hosts.flush()
        ssh.load_host_keys(known_hosts.name)
        ssh.set_missing_host_key_policy(paramiko.RejectPolicy())
        ssh.connect(
            os.environ["SFTP_HOST"], port=int(os.environ["SFTP_PORT"]),
            username=os.environ["SFTP_USER"], password=os.environ["SFTP_PASSWORD"],
            allow_agent=False, look_for_keys=False,
            timeout=15, banner_timeout=15, auth_timeout=15,
        )
        with ssh.open_sftp() as sftp:
            sftp.get_channel().settimeout(45)
            sftp.chdir("/Web-Relaunch-2026/DEV_TEST")
            if sftp.getcwd() != "/Web-Relaunch-2026/DEV_TEST":
                raise RuntimeError("Unexpected DEV_TEST SFTP path")
            with sftp.open(".rosenkranz-release.json", "rb") as file:
                remote = file.read()
            if remote != manifest_bytes(expected):
                raise RuntimeError("DEV_TEST release marker differs from approved Git commit")
            # The marker is written last by DEV_TEST only after changed files
            # have been uploaded and verified. Re-reading every unchanged image
            # here made each PROD promotion take many unnecessary minutes.
            names = list(expected["files"]) if os.environ.get("FULL_REMOTE_VERIFY") == "1" else ["index.html", "forms-config.json"]
            verify_remote_files(sftp, selected_manifest(expected, names))
    print(f"Approved release verified: {sha}, marker for {len(expected['files'])} files, {len(names)} remote spot checks, digest {expected['contentDigest']}")


if __name__ == "__main__":
    verify_sftp_release()

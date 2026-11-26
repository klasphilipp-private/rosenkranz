"""Dispatch and observe data-only DEV_TEST then PROD deployments after an API refresh."""

import json
import os
import subprocess
import tempfile
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import paramiko

from release_files import auto_data_file, file_delta, public_files, release_manifest


def gh(*args):
    for attempt in range(4):
        result = subprocess.run(["gh", *args], text=True, capture_output=True, check=False)
        if result.returncode == 0:
            return result.stdout
        if attempt == 3:
            raise RuntimeError(f"GitHub API command failed: gh {' '.join(args[:3])}: {result.stderr.strip()[:400]}")
        time.sleep(3)


def wait_for_run(workflow, title, started):
    deadline = time.monotonic() + 1200
    run_id = None
    while time.monotonic() < deadline:
        if run_id is None:
            runs = json.loads(gh("run", "list", "--workflow", workflow, "--event", "workflow_dispatch",
                                 "--limit", "30", "--json", "databaseId,displayTitle,createdAt"))
            matching = [run for run in runs if run["displayTitle"] == title and
                        datetime.fromisoformat(run["createdAt"].replace("Z", "+00:00")) >= started - timedelta(minutes=2)]
            if matching:
                run_id = matching[0]["databaseId"]
                print(f"Started {title}: https://github.com/{os.environ['GITHUB_REPOSITORY']}/actions/runs/{run_id}", flush=True)
        else:
            result = json.loads(gh("run", "view", str(run_id), "--json", "status,conclusion"))
            if result["status"] == "completed":
                if result["conclusion"] != "success":
                    raise RuntimeError(f"{title} failed: https://github.com/{os.environ['GITHUB_REPOSITORY']}/actions/runs/{run_id}")
                print(f"Completed {title} successfully.", flush=True)
                return
        time.sleep(12)
    raise TimeoutError(f"Timed out waiting for {title}")


def marker(username, password, remote_path):
    with tempfile.NamedTemporaryFile(mode="w") as known, paramiko.SSHClient() as ssh:
        known.write(os.environ["IONOS_SFTP_KNOWN_HOSTS"].rstrip() + "\n")
        known.flush()
        ssh.load_host_keys(known.name)
        ssh.set_missing_host_key_policy(paramiko.RejectPolicy())
        ssh.connect(os.environ["IONOS_SFTP_HOST"], port=int(os.environ["IONOS_SFTP_PORT"]),
                    username=username, password=password, allow_agent=False, look_for_keys=False,
                    timeout=15, banner_timeout=15, auth_timeout=15)
        with ssh.open_sftp() as sftp:
            sftp.chdir(remote_path)
            with sftp.open(".rosenkranz-release.json" if remote_path.endswith("DEV_TEST") else ".rosenkranz-prod-release.json", "rb") as file:
                result = json.load(file)
    sha = result.get("sourceCommit", "")
    if len(sha) != 40 or any(char not in "0123456789abcdef" for char in sha):
        raise RuntimeError("Remote release marker has no valid commit SHA")
    return result


def main():
    sha = os.environ["SOURCE_SHA"]
    if len(sha) != 40 or any(char not in "0123456789abcdef" for char in sha):
        raise ValueError("A full Git commit SHA is required")
    dev = marker(os.environ["IONOS_DEV_SFTP_USERNAME"], os.environ["IONOS_DEV_SFTP_PASSWORD"], "/Web-Relaunch-2026/DEV_TEST")
    prod = marker(os.environ["IONOS_PROD_SFTP_USERNAME"], os.environ["IONOS_PROD_SFTP_PASSWORD"], os.environ["IONOS_PROD_REMOTE_PATH"])
    if dev["sourceCommit"] == sha and prod["sourceCommit"] == sha:
        print("IONOS DEV_TEST and PROD already use the latest API snapshot.")
        return
    if dev["sourceCommit"] != sha:
        expected = release_manifest(Path.cwd(), public_files(Path.cwd(), include_maintenance=True), sha)
        changed, removed = file_delta(dev, expected)
        if not all(auto_data_file(name) for name in changed + removed):
            print("Automatic IONOS promotion paused: public layout or form files await manual DEV_TEST approval.", flush=True)
            return
        if subprocess.run(["git", "merge-base", "--is-ancestor", dev["sourceCommit"], sha], check=False).returncode:
            raise RuntimeError("DEV_TEST release marker is not an ancestor of the refreshed commit")
        started = datetime.now(timezone.utc)
        gh("workflow", "run", "deploy-dev-test.yml", "--ref", "main", "-f", "mode=upload",
           "-f", f"source_sha={sha}", "-f", "data_only=true")
        wait_for_run("deploy-dev-test.yml", f"DEV_TEST upload {sha}", started)
    if prod["sourceCommit"] != sha:
        started = datetime.now(timezone.utc)
        gh("workflow", "run", "deploy-prod-preview.yml", "--ref", "main", "-f", f"approved_sha={sha}",
           "-f", "data_only=true")
        wait_for_run("deploy-prod-preview.yml", f"PROD {sha}", started)


if __name__ == "__main__":
    main()

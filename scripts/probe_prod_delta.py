"""Prove delta rewrite rules on IONOS without changing the active website."""

import json
import os
import tempfile
import urllib.error

import paramiko

from deploy_prod_preview import PREVIEW, configured, http_bytes, replace_access


def main():
    run = os.environ["GITHUB_RUN_ID"]
    layer = f"probe-{run}"
    folder = f"codex-delta-{run}"
    path = f"{folder}/index.html"
    gone = f"codex-gone-{run}.txt"
    content = b"rosenkranz-delta-rewrite-ok"
    with tempfile.NamedTemporaryFile(mode="w") as known, paramiko.SSHClient() as ssh:
        known.write(os.environ["IONOS_SFTP_KNOWN_HOSTS"].rstrip() + "\n")
        known.flush()
        ssh.load_host_keys(known.name)
        ssh.set_missing_host_key_policy(paramiko.RejectPolicy())
        ssh.connect(os.environ["IONOS_SFTP_HOST"], port=int(os.environ["IONOS_SFTP_PORT"]),
                    username=os.environ["IONOS_PROD_SFTP_USERNAME"], password=os.environ["IONOS_PROD_SFTP_PASSWORD"],
                    allow_agent=False, look_for_keys=False, timeout=15, banner_timeout=15, auth_timeout=15)
        with ssh.open_sftp() as sftp:
            sftp.chdir(os.environ["IONOS_PROD_REMOTE_PATH"])
            with sftp.open(".htaccess", "rb") as file:
                previous = file.read()
            with sftp.open(".rosenkranz-prod-release.json", "rb") as file:
                prior = json.load(file)
            sha = prior["sourceCommit"]
            if sha.encode() not in previous or path in prior["files"] or gone in prior["files"] or layer in sftp.listdir("__releases"):
                raise RuntimeError("PROD release state is unexpected; refusing delta probe")
            base = prior.get("baseRelease", sha)
            sources = {**prior.get("fileSources", {}), path: layer}
            deleted = [*prior.get("deletedPaths", []), gone]
            before = http_bytes("/")[2]
            release = f"__releases/{layer}"
            sftp.mkdir(release)
            switched = False
            try:
                sftp.mkdir(f"{release}/{folder}")
                with sftp.open(f"{release}/{path}", "wb") as file:
                    file.write(content)
                replace_access(sftp, configured(previous, sha, base=base, sources=sources, deleted=deleted))
                switched = True
                for target in (f"/{folder}/", f"/{path}"):
                    status, _, body, _ = http_bytes(target)
                    if status != 200 or body != content:
                        raise RuntimeError(f"Delta rewrite failed for {target}")
                try:
                    http_bytes("/" + gone)
                except urllib.error.HTTPError as error:
                    if error.code != 410:
                        raise RuntimeError(f"Deletion rewrite returned {error.code}, expected 410") from error
                else:
                    raise RuntimeError("Deletion rewrite did not return 410")
                if http_bytes("/")[2] != before:
                    raise RuntimeError("Existing PROD homepage changed during delta probe")
                print("IONOS delta rewrite passed: changed file and directory alias 200, deletion 410, homepage unchanged.")
            finally:
                if switched:
                    replace_access(sftp, previous)
                for remove, name in ((sftp.remove, f"{release}/{path}"), (sftp.rmdir, f"{release}/{folder}")):
                    try:
                        remove(name)
                    except FileNotFoundError:
                        pass
                sftp.rmdir(release)
            if http_bytes("/")[2] != before:
                raise RuntimeError("PROD homepage did not return to its previous state")
            print(f"PROD router restored; preview remains {PREVIEW}")


if __name__ == "__main__":
    main()

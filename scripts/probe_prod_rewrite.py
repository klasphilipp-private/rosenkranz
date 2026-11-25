"""Diagnose IONOS Apache rewrite behavior with reversible, random test files."""

import os
import tempfile
import urllib.error
import urllib.request

import paramiko

from deploy_prod_preview import PREVIEW, replace_access, router


def request(path):
    try:
        with urllib.request.urlopen(PREVIEW + path, timeout=20) as response:
            return response.status, response.read(100)
    except urllib.error.HTTPError as error:
        return error.code, b""


def main():
    run = os.environ["GITHUB_RUN_ID"]
    probe = f"probe-{run}"
    public_file = f"codex-rewrite-{run}.txt"
    content = b"rosenkranz-rewrite-diagnostic"
    candidates = {
        "exact-L": f"RewriteEngine On\nRewriteRule ^{public_file}$ __releases/{probe}/marker.txt [L]\n".encode(),
        "exact-END": f"RewriteEngine On\nRewriteRule ^{public_file}$ __releases/{probe}/marker.txt [END]\n".encode(),
        "catchall-END": f"RewriteEngine On\nRewriteRule ^__releases/ - [END]\nRewriteRule ^(.*)$ __releases/{probe}/$1 [END]\n".encode(),
        "release-router": router(probe),
    }
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
            try:
                with sftp.open(".htaccess", "rb") as file:
                    previous = file.read()
            except FileNotFoundError:
                previous = None
            if previous is not None:
                raise RuntimeError("PROD .htaccess exists; diagnostic refuses to replace it")
            if "__releases" not in sftp.listdir("."):
                sftp.mkdir("__releases")
            sftp.mkdir(f"__releases/{probe}")
            try:
                with sftp.open(f"__releases/{probe}/marker.txt", "wb") as file:
                    file.write(content)
                with sftp.open(f"__releases/{probe}/{public_file}", "wb") as file:
                    file.write(content)
                for name, rules in candidates.items():
                    replace_access(sftp, rules)
                    path = "/" + ("marker.txt" if name.startswith("catchall") or name == "release-router" else public_file)
                    status, body = request(path)
                    print(f"Rewrite candidate {name}: HTTP {status}, expected content: {body == content}", flush=True)
            finally:
                replace_access(sftp, previous)
                for name in ("marker.txt", public_file):
                    sftp.remove(f"__releases/{probe}/{name}")
                sftp.rmdir(f"__releases/{probe}")


if __name__ == "__main__":
    main()

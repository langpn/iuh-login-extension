#!/usr/bin/env python3
"""
scripts/package_extension.py — Automated packager for IUH Fast Login extension.
Produces a clean .zip package ready for Chrome Web Store / Firefox AMO / GitHub Releases.
Excludes OS metadata (.DS_Store, Thumbs.db), Chrome unpack cache (_metadata), and dev files.
"""

import os
import sys
import json
import zipfile
import hashlib
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
EXT_DIR = ROOT_DIR / "extension"
DIST_DIR = ROOT_DIR / "dist"

EXCLUDE_NAMES = {
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini",
    ".git",
    ".gitignore",
}

EXCLUDE_DIRS = {
    "_metadata",
    "__pycache__",
    ".venv",
}


def get_version():
    manifest_path = EXT_DIR / "manifest.json"
    if not manifest_path.exists():
        print(f"Error: manifest.json not found at {manifest_path}", file=sys.stderr)
        sys.exit(1)
    with open(manifest_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        return data.get("version", "1.0.0")


def package():
    version = get_version()
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    out_filename = f"iuh-fast-login-v{version}.zip"
    latest_filename = "iuh-fast-login-latest.zip"
    out_path = DIST_DIR / out_filename
    latest_path = DIST_DIR / latest_filename

    print(f"📦 Packaging extension v{version}...")

    file_count = 0
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(EXT_DIR):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for file in sorted(files):
                if file in EXCLUDE_NAMES or file.endswith(".tmp"):
                    continue
                full_path = Path(root) / file
                arcname = full_path.relative_to(EXT_DIR)
                zf.write(full_path, arcname)
                file_count += 1
                print(f"  + {arcname}")

    # Copy to latest zip & Firefox xpi packages
    import shutil
    shutil.copyfile(out_path, latest_path)

    xpi_path = DIST_DIR / f"iuh-fast-login-v{version}.xpi"
    latest_xpi_path = DIST_DIR / "iuh-fast-login-latest.xpi"
    shutil.copyfile(out_path, xpi_path)
    shutil.copyfile(out_path, latest_xpi_path)

    # Sync updates.json for Firefox native auto-update
    updates_path = ROOT_DIR / "updates.json"
    updates_manifest = {
        "addons": {
            "iuh-fast-login@langpn": {
                "updates": [
                    {
                        "version": version,
                        "update_link": f"https://github.com/langpn/iuh-login-extension/releases/download/v{version}/iuh-fast-login-v{version}.xpi",
                    }
                ]
            }
        }
    }
    with open(updates_path, "w", encoding="utf-8") as f:
        json.dump(updates_manifest, f, indent=2)
        f.write("\n")

    size_kb = out_path.stat().st_size / 1024
    with open(out_path, "rb") as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()

    print(f"\n✅ Packaged {file_count} files successfully!")
    print(f"📍 Chrome/Edge : {out_path.name} & {latest_path.name}")
    print(f"📍 Firefox Dev : {xpi_path.name} & {latest_xpi_path.name}")
    print(f"🔄 Mozilla Manifest: {updates_path.name} (v{version})")
    print(f"📊 Size   : {size_kb:.2f} KB")
    print(f"🔑 SHA256 : {sha256}")


if __name__ == "__main__":
    package()

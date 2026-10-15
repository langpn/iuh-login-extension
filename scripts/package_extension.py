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
    out_path = DIST_DIR / out_filename

    print(f"📦 Packaging extension v{version}...")

    file_count = 0
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(EXT_DIR):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for file in sorted(files):
                if file in EXCLUDE_NAMES or file.endswith(".tmp"):
                    continue

                full_path = Path(root) / file
                arcname = full_path.relative_to(EXT_DIR)
                zf.write(full_path, arcname)
                file_count += 1
                print(f"  + {arcname}")

    size_kb = out_path.stat().st_size / 1024
    with open(out_path, "rb") as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()

    print(f"\n✅ Packaged {file_count} files successfully!")
    print(f"📍 Output : {out_path.relative_to(ROOT_DIR)}")
    print(f"📊 Size   : {size_kb:.2f} KB")
    print(f"🔑 SHA256 : {sha256}")


if __name__ == "__main__":
    package()

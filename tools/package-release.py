"""Build the React site and pack dist/ into release/portfolio-site.zip.

Usage (from the project root):
    python tools/package-release.py            # vite build + zip
    python tools/package-release.py --skip-build   # zip the existing dist/ only

The ZIP has index.html at its root and forward-slash paths, which is what
tools/cos-mcp/server.py expects.
"""
import os
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
OUT = ROOT / "release" / "portfolio-site.zip"


def build() -> None:
    # shell=True so Windows resolves npx.cmd
    subprocess.run("npx vite build", cwd=ROOT, shell=True, check=True)


def pack() -> None:
    if not (DIST / "index.html").exists():
        sys.exit("dist/index.html not found; run without --skip-build first")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for dirpath, _, files in os.walk(DIST):
            for name in files:
                full = Path(dirpath) / name
                z.write(full, full.relative_to(DIST).as_posix())
                count += 1
    with zipfile.ZipFile(OUT) as z:
        names = z.namelist()
    assert "index.html" in names, "index.html missing from ZIP"
    print(f"{OUT} ({OUT.stat().st_size / 1024 / 1024:.2f} MB, {len(names)} files)")


if __name__ == "__main__":
    if "--skip-build" not in sys.argv:
        build()
    pack()

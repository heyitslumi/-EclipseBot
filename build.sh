#!/usr/bin/env bash
set -euo pipefail
SRC_DIR="/srv/samba/shared/EclipseBot/."
DEST_DIR="/opt/discordbot"

cp -a --no-preserve=ownership "$SRC_DIR" "$DEST_DIR"
cd "$DEST_DIR"

if command -v dos2unix >/dev/null 2>&1; then
    echo "[build.sh] Normalizing line endings (CRLF -> LF) in scripts…"
    find . -type f \( -name "*.js" -o -name "*.json" -o -name "*.sh" \) -print0 | xargs -0 -r dos2unix
else
    echo "[build.sh] dos2unix not found; skipping line-ending normalization. Install dos2unix for cleaner lint runs." >&2
fi

echo "[build.sh] Installing dependencies..."

npm install

echo "[build.sh] Build complete."

if systemctl is-active --quiet dcboteclipse; then
    echo "[build.sh] Restarting dcboteclipse service..."
    sudo systemctl restart dcboteclipse
    sudo systemctl status dcboteclipse
fi
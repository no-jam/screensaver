#!/bin/sh
# Installs the Nojam screensaver and dynamic wallpaper from the latest release:
#
#   curl -fsSL https://raw.githubusercontent.com/no-jam/screensaver/main/install.sh | sh
#
# Files fetched with curl are not marked as downloaded from the internet, so macOS does not ask
# to verify them. Only your own folders are touched: ~/Library/Screen Savers and ~/Pictures.
# Run it again to update. To remove:
#   rm -rf ~/Library/Screen\ Savers/Nojam.saver ~/Pictures/Nojam.heic
set -eu

BASE="https://github.com/no-jam/screensaver/releases/latest/download"
SAVERS="$HOME/Library/Screen Savers"
PICTURES="$HOME/Pictures"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [ "$(uname -s)" != "Darwin" ]; then
  echo "This installs a macOS screensaver; run it on a Mac." >&2
  exit 1
fi

echo "Downloading the screensaver..."
# fetch url file magic offset: download, then check the file starts as it should (a zip with
# "PK", a HEIC with "ftyp" at byte 4), so a missing file fails with a clear message.
fetch() {
  if ! curl -fL --progress-bar -o "$2" "$1" || [ "$(head -c $(($4 + 4)) "$2" | tail -c 4 | head -c ${#3})" != "$3" ]; then
    echo "Could not download $(basename "$1") from the latest release." >&2
    echo "See https://github.com/no-jam/screensaver/releases, or try again in a few minutes." >&2
    exit 1
  fi
}
fetch "$BASE/Nojam.saver.zip" "$TMP/Nojam.saver.zip" PK 0
ditto -x -k "$TMP/Nojam.saver.zip" "$TMP"
mkdir -p "$SAVERS"
rm -rf "$SAVERS/Nojam.saver"
mv "$TMP/Nojam.saver" "$SAVERS/"
xattr -dr com.apple.quarantine "$SAVERS/Nojam.saver" 2>/dev/null || true

echo "Downloading the dynamic wallpaper (about 45 MB)..."
mkdir -p "$PICTURES"
fetch "$BASE/Nojam.heic" "$TMP/Nojam.heic" ftyp 4
mv -f "$TMP/Nojam.heic" "$PICTURES/Nojam.heic"

# Let System Settings and the screensaver host pick up the new copy.
killall "System Settings" WallpaperAgent legacyScreenSaver 2>/dev/null || true

cat <<'EOF'

Installed:
  Screensaver  ~/Library/Screen Savers/Nojam.saver
  Wallpaper    ~/Pictures/Nojam.heic

Screensaver: System Settings, Wallpaper, Screen Saver..., scroll to Other (Show All), Nojam.
             Options... sets Drift or Shuffle, colours and pace.
Wallpaper:   System Settings, Wallpaper, Add Photo..., Pictures, Nojam.heic, then Dynamic.
EOF

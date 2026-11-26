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
curl -fL --progress-bar -o "$TMP/Nojam.saver.zip" "$BASE/Nojam.saver.zip"
ditto -x -k "$TMP/Nojam.saver.zip" "$TMP"
mkdir -p "$SAVERS"
rm -rf "$SAVERS/Nojam.saver"
mv "$TMP/Nojam.saver" "$SAVERS/"
xattr -dr com.apple.quarantine "$SAVERS/Nojam.saver" 2>/dev/null || true

echo "Downloading the dynamic wallpaper (about 45 MB)..."
mkdir -p "$PICTURES"
curl -fL --progress-bar -o "$TMP/Nojam.heic" "$BASE/Nojam.heic"
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

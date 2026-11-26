#!/bin/sh
# Installs the Nojam screensaver and dynamic wallpaper from the latest release:
#
#   curl -fsSL https://raw.githubusercontent.com/no-jam/screensaver/main/install.sh | sh
#
# Files fetched with curl are not marked as downloaded from the internet, so macOS does not ask
# to verify them. Only your own folders are touched: ~/Library/Screen Savers and ~/Pictures/Nojam.
# Run it again to update. To remove:
#   rm -rf ~/Library/Screen\ Savers/Nojam.saver ~/Pictures/Nojam
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

echo "Downloading the wallpapers (about 200 MB)..."
WALLS="$PICTURES/Nojam"
mkdir -p "$WALLS"
fetch "$BASE/Nojam.heic" "$TMP/Nojam.heic" ftyp 4
mv -f "$TMP/Nojam.heic" "$WALLS/Nojam.heic"
# The Light, Dark and Auto wallpapers came in version 1.1.0: skip any the release lacks.
for name in Nojam-Light Nojam-Dark Nojam-Auto; do
  if curl -fsL -o "$TMP/$name.heic" "$BASE/$name.heic" &&
    [ "$(head -c 8 "$TMP/$name.heic" | tail -c 4)" = "ftyp" ]; then
    mv -f "$TMP/$name.heic" "$WALLS/$name.heic"
  else
    echo "  ($name.heic is not in the latest release yet; skipped)"
  fi
done
rm -f "$PICTURES/Nojam.heic" # where version 1.0.2 put it

# Let System Settings and the screensaver host pick up the new copy.
killall "System Settings" WallpaperAgent legacyScreenSaver 2>/dev/null || true

cat <<'EOF'

Installed:
  Screensaver  ~/Library/Screen Savers/Nojam.saver
  Wallpapers   ~/Pictures/Nojam/
                 Nojam.heic        day colours by day, night colours after dark
                 Nojam-Light.heic  day colours all day
                 Nojam-Dark.heic   night colours all day
                 Nojam-Auto.heic   follows your Light/Dark appearance setting

Screensaver: System Settings, Wallpaper, Screen Saver..., scroll to Other (Show All), Nojam.
             Options... sets Drift or Shuffle, colours and pace.
Wallpaper:   System Settings, Wallpaper, Add Folder..., choose Pictures/Nojam, then pick one.
             For the first three choose Dynamic in the menu next to it; for Nojam-Auto, Automatic.
EOF

#!/bin/sh
# Builds Nojam.saver (Apple silicon and Intel) into screensaver/dist/, and a zip of it.
# Needs macOS 12 or newer and the Xcode command line tools (xcode-select --install).
#
#   ./build.sh            build
#   ./build.sh install    build and install for this user (~/Library/Screen Savers)
set -eu
cd "$(dirname "$0")"

OUT=dist
SAVER="$OUT/Nojam.saver"
rm -rf "$OUT"
mkdir -p "$SAVER/Contents/MacOS" "$SAVER/Contents/Resources" "$OUT/obj"

for arch in arm64 x86_64; do
  xcrun swiftc -O -whole-module-optimization \
    -target "$arch-apple-macos12.0" \
    -module-name NojamSaver \
    -emit-executable -Xlinker -bundle \
    -framework ScreenSaver -framework WebKit -framework AppKit \
    macos/NojamSaverView.swift -o "$OUT/obj/Nojam-$arch"
done
xcrun lipo -create "$OUT/obj/Nojam-arm64" "$OUT/obj/Nojam-x86_64" -output "$SAVER/Contents/MacOS/Nojam"
rm -rf "$OUT/obj"

cp macos/Info.plist "$SAVER/Contents/Info.plist"
cp web/index.html "$SAVER/Contents/Resources/index.html"
cp macos/thumbnail.png macos/thumbnail@2x.png "$SAVER/Contents/Resources/"

# Ad-hoc signature: enough to run on the Mac that built it. To hand it to others without a
# Gatekeeper warning, sign with a Developer ID and notarize (see README.md).
codesign --force --sign "${SIGN_IDENTITY:--}" --timestamp=none "$SAVER"
codesign --verify --verbose "$SAVER"

(cd "$OUT" && ditto -c -k --keepParent Nojam.saver Nojam.saver.zip)
echo "Built $SAVER"

if [ "${1:-}" = "install" ]; then
  mkdir -p "$HOME/Library/Screen Savers"
  rm -rf "$HOME/Library/Screen Savers/Nojam.saver"
  cp -R "$SAVER" "$HOME/Library/Screen Savers/"
  # The old copy may still be loaded by the screensaver host; restart it.
  killall legacyScreenSaver 2>/dev/null || true
  echo "Installed. Choose Nojam in System Settings, Screen Saver."
fi

# Nojam screensaver for macOS

Our Suprematist compositions, in 3D: planes, the long green bar, the ochre sun, thin rules and
small accents. Each one is a slab floating at its own height over the ground. The shapes cast
soft shadows, the camera drifts slowly to give parallax, and every few seconds the shapes move
into a new picture. The pictures are generated, so no two are the same.

![Day](docs/preview-day.jpg)
![Night](docs/preview-night.jpg)

## Dynamic wallpaper

`Nojam.heic` is a macOS dynamic wallpaper of the same world through one day: 16 pictures, one
every 90 minutes, which macOS blends as the hours pass. The shapes move into a new composition
every six hours; the shadows follow the sun (long from the left in the morning, short at noon,
long to the right in the evening, warm at dawn and dusk); at night the colours turn dark and the
ochre sun becomes a pale moon. Each picture is 6016 x 3384.

Install: put `Nojam.heic` somewhere it can stay, then System Settings, Wallpaper, **Add Photo…**,
and choose **Dynamic** in the menu next to it.

Build it yourself (Node 22 with Playwright, Python with Pillow and pillow-heif):

```sh
node wallpaper/render.mjs          # 16 frames into wallpaper/frames/, rendered by web/index.html
python3 wallpaper/heic.py          # packs them into wallpaper/Nojam.heic with the day schedule
```

`index.html?wall=0.5&seed=nojam` shows any time of day in a browser (0 midnight, 0.5 noon).

## Options

In System Settings, Screen Saver, Nojam, **Options…**:

- **Motion.** *Drift*: each shape glides slowly into the next picture, so the picture simply
  changes (a new one about every 15 seconds). *Shuffle*: the shapes lift, spin and flip, and
  land in a new picture in a wave across the screen (about every 6 seconds). The camera swings
  with them.
- **Colours.** Match the system (day colours in Light mode, night in Dark), Day, or Night.
- **Pace.** From half speed to double.

## How it looks so sharp

- It renders at the display's full pixel density (Retina, 5K, 6K), with multisampling.
- On wide-colour displays (every recent Mac) it draws in Display P3, so the blue, green and
  ochre are more vivid than sRGB allows. On other displays it converts to sRGB.
- Shadows come from a 4096 px shadow map with contact hardening: sharp where a shape is close to
  the ground, softer the higher it floats.
- Light colours are dithered so the ground shows no banding.

## Install

One line in Terminal installs the latest release (screensaver and wallpaper):

```sh
curl -fsSL https://raw.githubusercontent.com/no-jam/screensaver/main/install.sh | sh
```

Files fetched with curl are not flagged by macOS, so it opens without a Gatekeeper warning. The
script (`install.sh`) only writes to `~/Library/Screen Savers` and `~/Pictures`; run it again to
update. To remove: `rm -rf ~/Library/Screen\ Savers/Nojam.saver ~/Pictures/Nojam.heic`.

## Build and install from source

You need macOS 12 or newer and the Xcode command line tools (`xcode-select --install`).

```sh
./build.sh install
```

That builds `dist/Nojam.saver` for Apple silicon and Intel, copies it to
`~/Library/Screen Savers`, and restarts the screensaver host. Then pick **Nojam** in System
Settings, Screen Saver. Without `install` it only builds, and also writes `Nojam.saver.zip`.

Ready-made builds are on the [Releases](https://github.com/no-jam/screensaver/releases) page:
download `Nojam.saver.zip`, unzip it and double-click `Nojam.saver`. Every push also builds it on
GitHub Actions (workflow "Build"), with the zip attached to the run.

A copy built on another Mac or downloaded from GitHub is only ad-hoc signed, so macOS warns
when you open it. Either right-click it and choose Open, or run
`xattr -dr com.apple.quarantine Nojam.saver` first. To share it widely, sign it with a Developer
ID (`SIGN_IDENTITY="Developer ID Application: …" ./build.sh`) and notarize the zip
with `xcrun notarytool`.

## Try it in a browser

Open `web/index.html` in Safari or Chrome. A small bar at the bottom switches motion
and colours. Keys: Space for the next picture, M for motion, T for colours, F for full screen.
The address takes the same settings: `index.html?mode=shuffle&theme=night&pace=1.5`.
Add `&seed=anything` to always start from the same picture.

## Files

| Path | What |
| --- | --- |
| `web/index.html` | The whole renderer: composition, motion, WebGL 2 shaders. No dependencies. |
| `macos/NojamSaverView.swift` | The screensaver: shows the page in a WKWebView, the Options sheet. |
| `macos/Info.plist`, `macos/thumbnail*.png` | Bundle details and the thumbnail in System Settings. |
| `build.sh` | Builds, signs and zips `Nojam.saver`. |
| `install.sh` | The one-line install: latest release into your Library and Pictures. |
| `wallpaper/render.mjs`, `wallpaper/heic.py` | Render the day's 16 pictures and pack them into `Nojam.heic`. |

The compositions follow the same rules as the pictures on [nojam.io](https://nojam.io), with
more shapes for a full screen. Our pictures are otherwise flat; the screensaver is the one place
they go 3D, on purpose.

## Releasing

On GitHub choose Actions, Release, **Run workflow**, and type the version (such as `v1.0.2`).
It builds `Nojam.saver.zip` on a Mac and `Nojam.heic` on Linux, then creates the tag and the
release on the latest `main` with both files and the notes in `.github/release-notes.md`.
Pushing a tag or publishing a release by hand does the same.

Keep `CFBundleShortVersionString` in `macos/Info.plist` in step with the tag.

## Licence

Copyright © Nojam. All rights reserved. See [LICENSE](LICENSE).

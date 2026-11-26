# Nojam screensaver for macOS

Our Suprematist compositions, in 3D: planes, the long green bar, the ochre sun, thin rules and
small accents. Each one is a slab floating at its own height over the ground. The shapes cast
soft shadows, the camera drifts slowly to give parallax, and every few seconds the shapes move
into a new picture. The pictures are generated, so no two are the same.

![Day](docs/preview-day.jpg)
![Night](docs/preview-night.jpg)

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

## Build and install

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

The compositions follow the same rules as the pictures on [nojam.io](https://nojam.io), with
more shapes for a full screen. Our pictures are otherwise flat; the screensaver is the one place
they go 3D, on purpose.

## Releasing

Either push a version tag (`git tag v1.0.0 && git push origin v1.0.0`), or on GitHub choose
Releases, Draft a new release, type a new tag such as `v1.0.0` on `main`, and publish. Either
way the "Release" workflow builds `Nojam.saver.zip` on a Mac and attaches it to the release
within a few minutes.

Keep `CFBundleShortVersionString` in `macos/Info.plist` in step with the tag.

## Licence

Copyright © Nojam. All rights reserved. See [LICENSE](LICENSE).

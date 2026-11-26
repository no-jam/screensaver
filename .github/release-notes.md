Two downloads:

- **Nojam.saver.zip**, the screensaver: Suprematist compositions in 3D that slowly drift, or shuffle, into new pictures.
- Four wallpapers of the same world, a new composition every hour, with the light and shadows of that hour:
  - **Nojam.heic**: day colours by day, night colours and a moon after dark (follows the clock).
  - **Nojam-Light.heic**: day colours all day.
  - **Nojam-Dark.heic**: night colours all day.
  - **Nojam-Auto.heic**: follows your Light/Dark appearance setting.

### Install (one line in Terminal)

```sh
curl -fsSL https://raw.githubusercontent.com/no-jam/screensaver/main/install.sh | sh
```

It puts the screensaver in `~/Library/Screen Savers` and the wallpapers in `~/Pictures/Nojam`. Files fetched with curl are not flagged by macOS, so there is no "could not verify" warning. Run it again to update.

Then:
- **Screensaver:** System Settings, Wallpaper, **Screen Saver…**, scroll to **Other** (click *Show All*), choose **Nojam**. **Options…** sets Drift or Shuffle, colours and pace.
- **Wallpaper:** System Settings, Wallpaper, **Add Folder…**, choose `Pictures/Nojam`, then pick one. For Nojam, Nojam-Light and Nojam-Dark choose **Dynamic** in the menu next to it; for Nojam-Auto, **Automatic**.

### Install by hand

Download the files below. Before opening the screensaver, run `xattr -dr com.apple.quarantine ~/Downloads/Nojam.saver` (it is not notarized by Apple yet), then double-click it.

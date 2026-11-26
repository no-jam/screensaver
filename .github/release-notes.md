Two downloads:

- **Nojam.saver.zip**, the screensaver: Suprematist compositions in 3D that slowly drift, or shuffle, into new pictures.
- **Nojam.heic**, a dynamic wallpaper: the same world through one day. The shapes move into a new composition every six hours, the shadows follow the sun, and at night the colours turn dark and the sun becomes a moon.

### Install (one line in Terminal)

```sh
curl -fsSL https://raw.githubusercontent.com/no-jam/screensaver/main/install.sh | sh
```

It puts the screensaver in `~/Library/Screen Savers` and the wallpaper in `~/Pictures`. Files fetched with curl are not flagged by macOS, so there is no "could not verify" warning. Run it again to update.

Then:
- **Screensaver:** System Settings, Wallpaper, **Screen Saver…**, scroll to **Other** (click *Show All*), choose **Nojam**. **Options…** sets Drift or Shuffle, colours and pace.
- **Wallpaper:** System Settings, Wallpaper, **Add Photo…**, choose `Nojam.heic` in Pictures, then **Dynamic** in the menu next to it.

### Install by hand

Download the files below. Before opening the screensaver, run `xattr -dr com.apple.quarantine ~/Downloads/Nojam.saver` (it is not notarized by Apple yet), then double-click it.

# Speedster — Playback Speed Controller

A Chrome extension for controlling video and audio playback speed on any website. Unlike other speed controllers, it treats `youtube.com` and `music.youtube.com` 
as completely separate sites — so you can speed up videos while keeping your music untouched.

---

## How it works

A small transparent HUD appears in the top-left corner of the video when you hover over it or change the speed. It fades away on its own after 2 seconds. Speed 
settings are saved per site, so Speedster remembers your preference each time you return.

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `D` | Increase speed by 0.1× |
| `S` | Decrease speed by 0.1× |
| `A` | Reset to 1.0× |

Shortcuts are disabled when typing in any input or text field.

---

## Mouse control

Hover over the top-left corner of a video to reveal the HUD, then click `+` or `−` to adjust speed. The HUD stays visible while your cursor is over it.

---

## Per-site control

Click the Speedster icon in the toolbar to open the popup. Use the toggle to enable or disable Speedster on the current site. Disabled sites are listed at the 
bottom and can be re-enabled anytime.

---

## Installation

1. Download and unzip the extension folder
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the folder
5. Pin Speedster from the extensions menu

---

## Changelog

### v1.1
- Added `A` key to instantly reset speed to 1.0×
- Changed decrease key from `A` to `S`
- HUD now appears correctly in fullscreen mode
- Fixed disable toggle not saving in the popup
- Fixed HUD hover detection on sites with video overlays (e.g. YouTube)

### v1.0
- Initial release
- HUD overlay on video with `+` / `−` buttons
- `D` to increase, `S` to decrease speed by 0.1×
- Per-site enable/disable toggle
- `youtube.com` and `music.youtube.com` treated as separate sites
- Speed memory per site
- Fullscreen keyboard support

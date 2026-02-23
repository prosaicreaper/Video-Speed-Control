SPEEDSTER — Playback Speed Controller
Chrome Extension v1.0
======================================


WHAT IT DOES
------------
Speedster lets you control the playback speed of any video or audio
on any website, directly from the page. A small transparent HUD
appears in the top-left corner of the video when you hover over it
or change the speed, then fades away on its own.


HOW TO INSTALL
--------------
1. Unzip the speedster-extension folder somewhere on your computer.
2. Open Chrome and go to: chrome://extensions
3. Enable "Developer mode" using the toggle in the top-right corner.
4. Click "Load unpacked" and select the speedster-extension folder.
5. The Speedster icon will appear in your Chrome toolbar.
   Pin it from the extensions menu for easy access.


CONTROLLING SPEED
-----------------
  Keyboard:
    D  —  increase speed by 0.1x
    A  —  decrease speed by 0.1x

  Mouse:
    Hover over the video to reveal the HUD, then click + or - to
    adjust speed. The HUD fades after 2 seconds of inactivity.

  Speed range: 0.1x to 5.0x
  Default speed: 1.0x


THE HUD
-------
The HUD is a small floating pill that appears in the top-left corner
of the video. It shows the current speed and has + / - buttons for
mouse control. It appears when you:
  - Move your mouse into the top-left area of a video
  - Press A or D on the keyboard
  - Click + or - in the HUD itself

It stays visible while your cursor is over it, and fades out
2 seconds after you stop interacting.


DISABLING FOR SPECIFIC SITES
-----------------------------
Click the Speedster icon in the toolbar to open the popup.
Use the toggle switch to enable or disable Speedster on the
current site. Disabled sites are listed at the bottom of the
popup, and can be re-enabled by clicking the X next to them.

IMPORTANT: youtube.com and music.youtube.com are treated as
separate sites. You can run Speedster on YouTube videos while
keeping it disabled on YouTube Music, or vice versa.


PER-SITE SPEED MEMORY
----------------------
Speedster remembers your last used speed for each site separately.
When you return to a site, it will automatically apply the speed
you left it at. Use the "reset to 1.0x" button in the popup to
clear the saved speed for the current site.


FILES
-----
  manifest.json   Extension configuration
  content.js      In-page HUD and speed control logic
  popup.html      Toolbar popup UI
  popup.js        Popup logic
  background.js   Service worker (initialises storage on install)
  icons/          Extension icons (16px, 48px, 128px)


NOTES
-----
- Speedster fights back against sites that try to reset the playback
  rate on their own (YouTube does this). If a site forcibly changes
  the rate, Speedster restores your setting automatically.

- The keyboard shortcuts (A and D) are disabled when your cursor is
  inside a text input, textarea, or any editable field, so they
  won't interfere with typing.

- If you reload the extension after making changes, go to
  chrome://extensions and click the refresh icon on the Speedster
  card, then reload any open tabs for the changes to take effect.


======================================
Built with the Chrome Extensions API (Manifest V3)

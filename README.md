# aboutme

A personal "about me" page styled as a retro desktop OS: draggable windows, a taskbar with a clock, desktop icons and an animated ASCII lava-lamp background. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

## Features

- **Window system.** `PORTFOLIO.EXE`, `LINKS.EXE` and `MUSIC.EXE` can be dragged, minimized, maximized and closed.
- **Taskbar.** One button per window, a `START` button that reopens everything, and a live clock.
- **Desktop icons.** Double-click to open (single tap on touch devices); focusable with Tab and opened with Enter or Space.
- **Music player.** A random 5-track playlist is picked from a pool on every page load, with an animated equalizer.
- **Animated background.** `lavalamp.html` renders a metaball lava lamp out of block characters on a canvas.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Page markup: windows, desktop icons, taskbar |
| `style.css` | All styling, including the responsive layout |
| `script.js` | Window logic, taskbar, clock, playlist, positioning |
| `songs.js` | `SONG_POOL`: the tracks `MUSIC.EXE` picks from |
| `lavalamp.html` | Background animation, loaded in an `<iframe>` |
| `icons/icons-sprite.png` | Desktop icon sprite (3 icons, 15x15 px each, scaled 3x) |

## Run locally

No installation is needed. Open `index.html` in a browser, or serve the folder:

```sh
python -m http.server 8000
# then open http://localhost:8000
```

The VT323 font is loaded from Google Fonts. Without a connection it falls back to a system monospace font.

## Customization

- **Content.** Edit the text in `index.html` (the `ABOUT ME`, `EXPERIENCE`, `INTERESTS` sections and the `LINKS.EXE` list).
- **Playlist.** Add or remove `{ artist, title }` entries in `songs.js`.
- **Background colours and character.** Change `CONFIG_BG_COLOR`, `CONFIG_LAVA_COLOR` and `CONFIG_CHAR` at the top of the script in `lavalamp.html`. Press `p`, `c` or `G` while the background has focus for extra modes.
- **Colour scheme.** The palette is `#0D0D15` (background) and `#ac3232` (text and borders) in `style.css`.

## Responsive behaviour

- **1151px and wider (desktop).** The page does not scroll. Windows are positioned freely, kept inside the viewport above the taskbar and limited in height, and only the content area of a window scrolls when it does not fit. Spacing and fonts are compacted on viewports up to 1366px wide or 900px tall.
- **1150px and narrower (tablets, phones, heavily zoomed or scaled desktops).** Windows stack in one column, the page scrolls normally, and dragging is disabled.
- **Touch and hybrid devices.** Hover effects apply only to fine pointers, touch targets are at least 44px, and safe-area insets are respected (`viewport-fit=cover`).

The 1150px breakpoint is defined twice, as `@media (max-width: 1150px)` in `style.css` and as `STACKED_QUERY` in `script.js`. Change both together.

## Browser support

Developed for current Chrome, Edge, Firefox, Safari (macOS and iOS), Samsung Internet and Opera. Layout was verified in Chromium from 320x700 to 2560x1440. Other engines have not been tested on real devices.

## Known limitations

- Windows can be dragged with a mouse only, not by touch.
- Playlist tracks are visual only; nothing is actually played.

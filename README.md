# Captain's Rift — League Captain Selector

A League of Legends–inspired party tool: add your lobby, spin the wheel, and let fate choose the captain. The winner gets a personalized roast that stays on screen until they press OK.

> Content warning: the regular roast list contains explicit language and offensive jokes. Edit it to suit your group before sharing the app.

## Features

- Equal-sized slices and equal selection odds for 2–12 players.
- Default roster: ShinyUnicorn, Madragor, PapaKarlo, amg28, and Lostforwords.
- Slice-aligned SVG names that scale to fit and rotate with the wheel.
- A nine-second spin with smooth slowdown, gold/cyan effects, and reduced-motion support.
- Synthesized spin ticks and a winner chime, with a remembered sound toggle.
- Editable text files for regular roasts and gentler wife-mode messages.
- No account, database, build step, or package installation required.

## Run locally

Install Python 3, then run these commands in a terminal:

```sh
git clone https://github.com/DmitryAnashko/LeagueCaptainSelector.git
cd LeagueCaptainSelector
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

On Windows, use `py` instead of `python` if that is your Python launcher. On macOS/Linux, the command may be `python3`.

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/) in your browser. Keep the terminal running; press Ctrl+C to stop the server. If the browser reports "connection refused", start the server again.

Serve the folder over HTTP rather than opening `index.html` directly: roast files are loaded using `fetch`. If a roast file is missing, empty, or cannot be loaded, built-in fallback messages are used.

## How to use

1. Keep the default roster or add/remove players. Names are limited to 18 characters.
2. With at least two players, press **Roll the wheel**.
3. The chosen captain and their roast appear after the spin. Press **OK** to dismiss the popup.

Sound begins only after interaction with the page. Use **Sound on/off** below the wheel to mute it. The roster resets to its defaults on reload.

## Customize roasts

Edit these UTF-8 text files:

- [`dist/roasts.txt`](dist/roasts.txt): regular, harsher messages.
- [`dist/wife-roasts.txt`](dist/wife-roasts.txt): mild teasing and encouragement.

Put one message on each line. Blank lines and lines starting with `#` are ignored. Use `{name}` wherever the selected captain's name should appear:

```text
# One message per line
{name}, your minimap has been promoted to co-captain. Please consult it occasionally.
```

Save the file and reload the page to load changes. Messages are chosen randomly from the applicable list; repeats are possible.

## Wife mode

There are no automatic wife-mode names. Matching is case-insensitive and ignores surrounding whitespace. The former defaults (ShinyUnicorn, Ilma, and Wife) are removed from older saved lists once when this version loads; other saved names are preserved. Any name can then be added manually.

To add a name, click the same player's slice **three times within 700 milliseconds** while the wheel is stopped. Click inside the slice, away from the center hub and outer border. This shortcut intentionally has no visible confirmation. It only adds names; it is not a toggle.

Added names are saved in that browser's `localStorage`. They survive reloads but are not synchronized between browsers or different site addresses. Wife mode changes only the roast list, not the odds of winning.

To print the saved names, open your browser's developer console and run:

```js
console.log(JSON.parse(localStorage.getItem('captains-rift.wife-mode-names.v1') || '[]').join('\n'));
```

To remove all names added with the shortcut, run:

```js
localStorage.removeItem('captains-rift.wife-mode-names.v1');
location.reload();
```

After resetting, no names are in wife mode. If browser storage is blocked, additions work only for the current page session.

## Technology and project layout

Plain HTML, CSS, and JavaScript; SVG labels/icons; CSS gradients and animations; Web Audio API for synthesized sound. Python is only an optional local file server, not an application backend. Fonts load from Google Fonts, with system-font fallbacks.

```text
dist/
  index.html         Page, styling, and wheel logic
  wheel-audio.js     Synthesized audio and sound preference
  roasts.txt         Regular roast list
  wife-roasts.txt    Gentle roast list
  favicon.svg       Site icon
.openai/
  hosting.json      Existing Sites project configuration; not needed locally
```

The `dist` folder contains the editable site itself, not generated build output. Default players and spin duration are configured in `dist/index.html`.

## Disclaimer

This is a fan-made party tool, not affiliated with or endorsed by Riot Games. League of Legends and related trademarks belong to their respective owners.

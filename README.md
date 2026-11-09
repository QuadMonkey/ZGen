# ZGEN

A text adventure in the style of the 1980s Infocom classics, set in modern times.
You are a Gen Z kid in a small town on the morning the zombie apocalypse starts. Survive, and reach one of
three escapes: a ferry to a government island, a bunker under Mount Kestrel, or a helicopter from an airfield.

It runs in the browser inside a CSS-drawn 1980s colour monitor, by **Gammolore**.

## Play

No install and no build step. Open `index.html` in a browser (or use the VS Code "Live Server" extension).
Click or press any key to "power on" the monitor, which also goes full screen. Type `help` in the game.
Add `?skip` to the URL to skip the boot sequence.

## Develop

- `game.js`: the whole game. World data (rooms, items, events, endings) at the top, the parser and verbs below.
- `index.html`: the monitor, the CRT effects and the boot sequence.
- `test.js`: `node test.js` replays all three endings, the side quests and a perfect 125-point run.

## Licence

Everything original in this repository, code, text, names and artwork, is released under the MIT licence (see `LICENSE`).

Third party: the pixel font [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) is under the
SIL Open Font License 1.1 (see `assets/fonts/OFL.txt`).

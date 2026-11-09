<p align="center">
  <img src="assets/zgen-full-logo.png" alt="ZGen" width="560">
</p>

<p align="center">
  <em>The Z stands for Generation and Zombies.</em><br>
  An interactive survival fiction in the style of the 1980s text adventures, set in modern times.
</p>

<p align="center">
  A game by<br>
  <img src="assets/gammolore-badge.png" alt="Gammolore" width="240">
</p>

---

## The story

It is 6:40 on a Friday morning. You are a Gen Z kid in a small town called Millbrook, running on four hours of
sleep and 14% battery. Your mom has already left for the hospital. Your phone is about to scream.

Something is going around, and it is not the flu. The government has opened three evacuation sites. You have to
survive the morning, find your way across a town that is falling apart, and get out through one of them:

1. **A ferry from Pier 9** to Haven Island, a secure island settlement built in preparation.
2. **Bunker Halcyon**, a huge underground shelter in the Mount Kestrel mountains, stocked for years.
3. **Fort Marrow Airfield**, a helicopter extraction to the fleet offshore.

The game runs in your browser inside a 1980s-style colour monitor drawn entirely in CSS: scanlines, glass glare,
a fake "loading" boot sequence, and a 40-column pixel font.

## Play

There is nothing to install and no build step. Open `index.html` in a web browser (or use the VS Code
**Live Server** extension).

- Click, or press any key, to **power on** the monitor. This also takes the game full screen (press `Esc` to leave).
- Any key or click while text is typing skips ahead to the end of it.
- The up and down arrow keys recall earlier commands.
- The monitor's **POWER** button restarts the game.
- Add `?skip` to the address (`index.html?skip`) to skip the boot sequence.

### On a phone

On a phone the cabinet disappears and the CRT picture fills the screen. You do not have to type:

- **Direction buttons** on the left. Only the directions that really exist from where you are are lit.
- **Verb buttons** on the right (`TAKE`, `DROP`, `EXAM`, `READ`, `OPEN`, `USE`, `TALK`, `GIVE`, `ATTK`, `THRW`, `PUT`, `WAIT`, `INV`, `HINT`, `SCOR`).
  Tap a verb and a strip shows the things in the room you can use it on. Tap one to do it.
- **TYPE** opens the keyboard when you need to type something specific. While it is open the buttons tuck away so the
  story has room. Tapping the `>` line opens it too.
- Tap any earlier `>` command in the story to repeat it. **AA** changes the text size.
- The game **autosaves** whenever you leave the tab. If your browser throws the tab away, type `continue` to resume.
- The bunker keypad needs the keyboard, because you have to type the four-digit code.

## How to play

You type short commands and the game answers, the way text adventures always have. Try things. Nothing is
off limits, and the game will tell you when it does not understand.

```
> take phone
> examine note
> put kit in backpack
> attack zombie with bat
> give pills to mrs alvarez
> throw speaker north
```

| What you want to do | Commands |
| --- | --- |
| Move | `n` `s` `e` `w` `ne` `nw` `se` `sw` `up` `down` `in` `out` |
| Look around | `look`, `examine <thing>`, `read <thing>`, `search <thing>`, `listen` |
| Handle things | `take`, `take all`, `drop`, `open`, `close`, `put <x> in <y>`, `wear`, `remove`, `eat`, `drink`, `use` |
| Phone | `check phone`, `turn on phone`, `turn off phone`, `plug phone into charger` |
| Fight | `attack zombie with <weapon>` (or just `attack zombie` to use whatever you are holding) |
| People | `talk <person>`, `give <thing> to <person>`, `show <thing> to <person>` |
| Tools | `pry <x> with <y>`, `cut <x> with <y>`, `unlock <x> with <y>`, `push <x>`, `throw <x> <direction>`, `tape <x>` |
| Game | `inventory` (or `i`), `score`, `diagnose`, `hint`, `save`, `restore`, `restart`, `quit`, `verbose`, `brief`, `again` (or `g`) |

The text is colour-coded: room names in yellow, things you can pick up in cyan, people speaking in green, your phone in mint, the
world moving on in pink, danger as white on a red bar, and routine replies such as "Taken." in a quiet blue. Your own commands are
amber. Type `colour` to switch the colours off (and on again) if you prefer plain text.

`save` stores your game in your browser, so it lasts until you clear your site data. `continue` resumes the autosave.

## How survival works

**Your phone is everything.** It is your flashlight, your clock, and the boarding pass for the ferry.

- The battery drains by 1% every 2 moves while the phone is on. `turn off phone` stops the drain, but then you
  have no light and cannot show your pass.
- It charges by 10% a move while it is plugged in: the charger must be in a wall outlet with the phone lying
  next to it. Picking up the phone or the charger stops it.
- **The power goes out at move 45.** After that the only ways to charge are portable power banks and a solar
  charger. Find them.
- Dark places (the stockroom, the evidence room, the mine tunnel) need your phone on. In the dark you are
  likely to be bitten by something.

**Zombies get one free move, then they bite.** When you walk into a room with zombies you get one free action.
After that, every action you take lets them bite. Leave, or fight. Three bites and you are done. A hoodie takes
one bite for you, and a ballistic vest takes two. First-aid kits and bandages heal you, and so do some snacks.

Zombies are drawn to noise. There are more of them, in more places, the longer the morning goes on.

**You can only carry so much.** You can hold 6 things in your hands, plus 8 more inside your backpack. `wear`
things to carry them for free. Weapons: a baseball bat, nightstick, hockey stick, hammer, crowbar, or a spear
you can build yourself.

**Talk to people.** There are survivors in Millbrook. Some of them need help, and some of them can help you.

**Stuck?** Type `hint`. The hints change as the game goes on.

## How to win

You win by reaching one of the three escapes. Each one needs a different set of things, and you only get
to take one. The spoilers are folded away. Open one only when you want it.

<details>
<summary><strong>Spoilers: Pier 9 and the ferry to Haven Island</strong></summary>

1. Your phone receives the **evacuation pass** a few moves into the game. Keep the phone charged, and keep it on.
2. Head south from Maple Street to the town square, then southeast to the river. Pier 9 is east along Harbor Road.
3. Harbor Road fills with a **horde** around move 30, and you cannot get through it. Draw it off with noise: take
   the Bluetooth speaker from Zap! Electronics (in the mall, southwest of the square), `turn on speaker`, then
   from Riverside Walk `throw speaker north` into the skate park. The zombies follow the music.
4. At the gate, `show phone to guard`. He scans the pass and opens the gate.
5. Go east to the pier and `board boat`.

Bonus: go to the hospital's staff room and open your mom's locker before you leave town. If you find her note,
you will find her on the boat.
</details>

<details>
<summary><strong>Spoilers: Bunker Halcyon</strong></summary>

1. The bunker is at the end of the old mine tunnel, up Mount Kestrel. Go northwest from the town square through
   Greenwood Park to the trailhead, then keep going north.
2. The **Ranger Station** door is locked. Mrs. Alvarez, on the porch west of Maple Street, has the key, and she
   will trade it for her heart pills from the pharmacy. You can also pry the door open with a crowbar.
3. Inside, read the **logbook** for the keypad code, and take the **keycard**.
4. The tunnel past the station is pitch black. Turn your phone on.
5. At the Halcyon Gate, `swipe keycard`, then `enter code 6174`. When the door opens, go north.
</details>

<details>
<summary><strong>Spoilers: Fort Marrow Airfield and the helicopter</strong></summary>

1. Go northeast from the town square to the Route 9 on-ramp, then east to the airfield gate.
2. The gate is chained shut. You need **bolt cutters**, which Handy Hank's Hardware (east off Main Street) sells.
   `cut chain with bolt cutters`.
3. The helicopter comes for a **signal flare**, and the **flare gun** is locked in the police station's evidence
   room, below the station. Its door needs prying open with a crowbar (the garage toolbox has one), and the room
   is dark, so bring your phone.
4. Cross the hangar (watch for zombies) and go east to the helipad. `fire flare gun`.
</details>

## Scoring

The game is scored out of **125**. You earn points for finishing quests, for finding things, for fighting, for
helping people, and 20 points for reaching an escape. Type `score` any time.

| Score | Rank |
| --- | --- |
| 100 or more | Certified Apex Survivor |
| 85 to 99 | Main Character |
| 65 to 84 | Final Girl (or Boy) |
| 45 to 64 | Survivor |
| 25 to 44 | Side Character |
| 10 to 24 | NPC |
| 0 to 9 | Chronically Online |

A full 125 is possible, but it means doing almost everything in Millbrook before you leave, and that includes
helping people along the way and doing a few things before the power goes out.

## Develop

- `game.js`: the whole game. World data (rooms, items, events, endings) is at the top, and the parser and verbs
  are below.
- `index.html`: the monitor, the screen effects, the boot sequence and the phone layout. Add `?mobile` to the address
  to force the phone layout on a desktop browser.
- When you change `game.js` in a way `index.html` depends on, bump the `?v=` number on the `game.js` script tag in
  `index.html`. Browsers cache files for a few minutes, and the number makes sure a new page never runs an old engine.
- `test.js`: run `node test.js` to replay all three endings, the side quests, and a perfect 125-point run.

## Licence

Everything original in this repository, including the code, text, names and artwork, is released under the MIT
licence (see `LICENSE`).

Third party: the pixel font [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) is under the
SIL Open Font License 1.1 (see `assets/fonts/OFL.txt`).

ZGen is inspired by the classic text adventures of the 1980s. It is an original game and is not affiliated with,
or endorsed by, any of their makers.

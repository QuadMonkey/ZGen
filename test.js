// Walks all three endings. Run: node test.js
const g = require('./game.js');
const assert = require('assert');
function play(cmds, expect) {
  g.start();
  let last = '';
  for (const c of cmds.split(';').map(x => x.trim()).filter(Boolean)) last = g.run(c);
  assert(last.includes(expect), `expected "${expect}" but last output was:\n${last}`);
  console.log(expect, '- score', g.S.score, 'moves', g.S.moves);
}
const start = 'wait;wait;wait;wait;wait;wait;wait;wait;wait;take phone;take charger;take hoodie;wear hoodie;take backpack;put charger in backpack;e;e;take kit;put kit in backpack;w;d;turn on tv;e;read note;e;take bat;open toolbox;take crowbar;put crowbar in backpack;sw;open mailbox;take leaflet;put leaflet in backpack;s;listen suv';
const pills = ';s;s;w;attack zombie;take pills;e;n;n;w;give pills to mrs;e';
// Dock: pills quest, speaker from mall, lure horde, show pass
play(start + pills + ';s;s;sw;e;take speaker;turn on speaker;w;ne;se;throw speaker north;e;e;show phone to guard;e;board boat', 'HAVEN ISLAND');
// Bunker: ranger key from Mrs. Alvarez, logbook, keycard, dark mine
play(start + pills + ';s;s;nw;n;n;unlock door with key;n;read logbook;take keycard;turn on phone;n;attack zombie;n;swipe keycard;enter code 6174;n', 'HALCYON');
// Airfield: bolt cutters, flare gun from evidence, hangar fight
play(start + ';s;e;take cutters;w;s;e;pry door with crowbar;d;take flare gun;u;w;ne;e;cut chain with bolt cutters;e;attack zombie;attack zombie;e;fire flare gun', 'EVACUATED');

// -- failure paths ------------------------------------------------------
// three zombie bites in the hospital lobby kill you
play('e;d;e;e;sw;s;s;s;s;wait;wait;wait;wait', 'walking dead');
// the barricade holds when the horde arrives at move 30
play('e;d;push couch;' + 'wait;'.repeat(27), 'The couch holds');
// a dead phone gets you nowhere with the pier guard
play('turn off phone;take phone;e;d;e;e;sw;s;s;s;se;e;e;show phone to guard', 'Turn it on');
// the harbor horde (4 zombies) blocks the road to the pier
play('e;d;push couch;' + 'wait;'.repeat(27) + ';e;e;sw;s;s;s;se;e', 'draw them off');

// -- new side content ---------------------------------------------------
// Maya: give her food, get the ChargePod power bank
play('e;d;e;e;sw;s;e;take chips;w;s;s;sw;s;give chips to maya', 'ChargePod acquired');
// Reyes: bring Delgado's badge back from the hospital ward
play('e;d;e;e;take bat;sw;s;s;s;s;w;attack zombie;take badge;e;n;e;give badge to reyes', 'bringing him home');
// Sam: bandage his ankle, get the solar charger, and it works outdoors
play('e;d;e;e;sw;s;s;s;w;take bandage;e;nw;n;n;e;give bandage to sam', 'Solar charger acquired');
play('e;d;e;e;sw;s;s;s;w;take bandage;e;nw;n;n;e;give bandage to sam;use solar charger', 'phone reads');
// knife + duct tape = spear
play('e;d;e;take knife;e;sw;s;s;e;take duct tape;tape knife', 'absolutely a spear');
// fountain pennies feed the arcade machine
play('e;d;e;e;sw;s;s;s;sw;take coins;s;w;put coins in machine', 'GALAXY WARP');
// spear needs a pipe and tape, not just a knife
play('e;d;e;take knife;tape knife', 'still need: a length of pipe and duct tape');
// small parser gaps
play('turn off phone;take phone;take charger;use charger', 'charging icon glows');
play('e;d;e;e;sw;s;s;s;sw;e;take speaker;use speaker', 'blasts a slowed');
play('go upstairs', "can't go that way"); // no stairs in the bedroom, but the word must parse
// cannot attack with a weapon lying on the floor
g.start(); g.S.room = 'pharmacy'; g.S.z.pharmacy = 1; g.S.at.bat = 'pharmacy';
assert(g.run('attack zombie with bat').includes("aren't holding"), 'weapon on the floor should not count');
// a bare 4-digit number works at the keypad
g.start(); g.S.room = 'bunker_door'; assert(g.run('6174').includes('green light'), 'bare code should parse');
// the pitch-black rule: nothing in a dark room can be taken without light
g.start(); g.S.room = 'evidence'; g.S.f.phone_on = 0; assert(g.run('take flare gun').includes('too dark'), 'blind take must fail');
// blackout: TV and arcade stop working
g.start(); g.S.room = 'living'; g.S.f.power = 0; assert(g.run('turn on tv').includes('power is out'), 'TV needs power');
console.log('parser/continuity checks ok');

// -- the perfect run: every quest, every side quest, then the airfield ending, for the full 125 points.
// "fight" means: keep attacking until the room is clear (what a player would do).
{
  g.start();
  const steps = [
    'take backpack;take hoodie;wear hoodie;e;e;take kit;put kit in backpack;w;d;turn on tv;push couch;e;read note;take knife;put knife in backpack;e;take bat;open toolbox;take crowbar;put crowbar in backpack;w;w;u;w;take phone',
    'e;d;e;e;sw;open mailbox;read leaflet;s;listen suv',
    's;s;sw;take coins;s;w;put coins in machine;e;n;e;take speaker;put speaker in backpack;w;ne', // arcade needs power: before the move-45 blackout
    'w;fight;take pills;take bandage;put bandage in backpack;e;n;n;w;give pills to mrs;e;e;fight;n;take bank;put bank in backpack;s;take chips;put chips in backpack;w;s;e;fight;take cutters;tape knife',
    'put cutters in backpack;put key in backpack;w;s;s;fight;w;fight;take badge;e;e;open locker;read mom note;w;n;e;fight;give badge to reyes;pry door with crowbar;d;take flare gun;u;w',
    'sw;fight;s;give chips to maya;n;ne',
    'use chargepod;drop chargepod;se;fight;take speaker;turn on speaker;throw speaker north;e;e;show phone to guard;w;w;nw',
    'use first aid kit;nw;fight;n;n;e;give bandage to sam;use solar;drop solar;w;unlock door with key;n;read logbook;take keycard;n;fight;n;swipe keycard;enter code 6174',
    's;s;s;s;s;se;ne;fight;e;cut chain with bolt cutters;e;fight;take vest;wear vest;e;fire flare gun'
  ].join(';').split(';');
  let last = '';
  for (const c of steps) {
    if (c === 'fight') { for (let n = 0; g.S.z[g.S.room] > 0 && n < 8; n++) g.run('attack zombie'); continue; }
    last = g.run(c);
  }
  assert(last.includes('EVACUATED'), 'perfect run should end at the airfield:\n' + last);
  assert.strictEqual(g.S.score, 125, 'perfect run should score every point, got ' + g.S.score);
  console.log('perfect run - score', g.S.score, 'moves', g.S.moves);
}
// throwing works on things in your backpack too
g.start(); g.S.room = 'riverside'; g.S.at.backpack = 'inv'; g.S.at.speaker = 'in:backpack';
assert(g.run('throw speaker north').includes('clatters into'), 'throw from the backpack');
console.log('throw-from-backpack ok');

// -- phone support: the tap buttons rely on context() and on "use" doing the obvious thing
{
  g.start(); g.S.at.phone = 'inv'; // a lit phone, so dark rooms are not blind
  const lone = Object.keys(g.S.at).filter(id => g.S.at[id] !== 'inv' && g.S.at[id] !== 'worn' && !String(g.S.at[id]).startsWith('in:') && g.S.at[id] !== 'nowhere' && id !== 'phone');
  for (const id of lone) {
    g.S.room = g.S.at[id];
    const entry = g.context().items.find(i => i.id === id);
    assert(entry, `context() offers no button word for "${id}" in ${g.S.room}`);
    assert(!g.run('examine ' + entry.word).includes("can't see"), `button word "${entry.word}" for "${id}" is not understood`);
    g.S.at.phone = 'inv'; g.S.room = g.S.at[id];
  }
  assert.strictEqual(lone.length > 30, true, 'expected to check dozens of items');
  console.log('context() words ok for', lone.length, 'items');

  g.start(); assert.deepStrictEqual(g.context().exits.map(e => e.dir), ['e'], 'bedroom has one exit');
  g.S.room = 'police'; g.S.at.crowbar = 'inv'; assert(g.run('use crowbar').includes('lock shrieks'), 'use crowbar should pry the evidence door');
  g.S.room = 'afgate'; g.S.at.cutters = 'inv'; assert(g.run('use bolt cutters').includes('CLANG'), 'use cutters should cut the chain');
  g.S.room = 'living'; assert(g.run('use couch').includes('shove the couch'), 'use couch should barricade');
  g.S.at.drink = 'inv'; assert(g.run('use energy drink').includes('heart does a drum solo'), 'use on food should eat it');
  g.S.room = 'pier'; assert(g.run('use ferry').includes('HAVEN ISLAND'), 'use ferry should board it');
  // autosave resume
  const store = {}; global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => delete store[k] };
  g.start(); assert(g.run('continue').includes('No autosaved'), 'nothing to resume yet');
  g.run('e'); store['zgen-auto'] = JSON.stringify(g.S); g.start(); assert(g.run('continue').includes('Resuming') && g.S.room === 'hall', 'continue should restore the saved room');
  delete global.localStorage;
  console.log('phone-support checks ok');
}

// -- colours: the engine labels each piece of output; the text itself must be unchanged
{
  g.start();
  const labels = () => g.chunks().map(c => c[1]);
  assert.strictEqual(labels()[0], 'room', 'the title is a room-style line');
  assert(labels().includes('item'), 'items are labelled');
  const text = g.run('take phone'); assert.strictEqual(g.chunks().map(c => c[0]).join('\n'), text, 'chunks join back to the exact output');
  assert(labels().includes('dim'), 'Taken. is dim');
  g.run('check phone'); assert(labels().includes('phone'), 'phone screen is labelled');
  g.S.room = 'porch'; g.run('knock door'); assert(labels().includes('speech'), 'NPC talk is speech');
  g.run('hint'); assert(labels().includes('hint'), 'hints are labelled');
  g.S.room = 'hospital'; g.S.zt = 0; g.run('look'); assert(labels().includes('danger'), 'zombies are danger');
  g.S.moves = 11; g.run('wait'); assert(labels().includes('event'), 'timed events are labelled');
  console.log('colour labels ok');
}

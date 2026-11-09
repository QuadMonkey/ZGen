'use strict';
// ZGEN — a text adventure. World data first, engine below. Runs in the browser (index.html) and in Node (test.js).
const MAX = 125, CARRY = 6, PACK = 8;
const DIR = { n: 'n', north: 'n', s: 's', south: 's', e: 'e', east: 'e', w: 'w', west: 'w', ne: 'ne', northeast: 'ne', nw: 'nw', northwest: 'nw', se: 'se', southeast: 'se', sw: 'sw', southwest: 'sw', u: 'u', up: 'u', d: 'd', down: 'd', upstairs: 'u', downstairs: 'd', in: 'in', inside: 'in', out: 'out', outside: 'out' };
const DNAME = { n: 'north', s: 'south', e: 'east', w: 'west', ne: 'northeast', nw: 'northwest', se: 'southeast', sw: 'southwest', u: 'up', d: 'down', in: 'in', out: 'out' };
const ZW = new Set('zombie zombies walker walkers undead horde crowd soldiers driver creature monster'.split(' '));
const ZOMBIE = { id: 'zombie', name: 'zombie', zombie: true };
let S, out, tags, ctx = '', pending = null; // pending: a yes/no question waiting for an answer
// Routine confirmations recede (shown dim); everything else is plain unless the caller labels it.
const DIM = /^(.+: )?(Taken|Dropped|Done|Closed|Removed|Opened)\.|^(You can't|You don't|You already|You are carrying too much|You are not wearing|There is nothing here|There are no zombies|I don't know the word|Time passes|It is already|Nobody answers|That won't budge|Which direction|Take what|Drop what|Open what|Read what|Put what|Use what|Talk to whom)/;
const ask = (q, yes) => { pending = yes; say(q, 'hint'); };
const say = (s, c) => { tags.push(c || ctx || (DIM.test(s) ? 'dim' : '')); return out.push(s); };
const aw = (k, p) => { if (!S.f['s_' + k]) { S.f['s_' + k] = 1; S.score += p; } };
const cap = s => s[0].toUpperCase() + s.slice(1);
const ids = loc => Object.keys(items).filter(i => S.at[i] === loc);
const isOpen = i => !!S.f['o_' + i];
const val = v => (typeof v === 'function' ? v() : v);
function vis(i) {
  const a = S.at[i];
  if (a === S.room || a === 'inv' || a === 'worn') return true;
  if (a && a.startsWith('in:')) { const c = a.slice(3); return vis(c) && isOpen(c); }
  return false;
}
const charging = () => !!(S.f.plugged && S.f.power && S.at.phone === S.f.plugged && S.at.charger === S.f.plugged);
const lit = () => !!(S.f.phone_on && S.bat > 0 && vis('phone'));
const phoneTime = () => { const m = 400 + S.moves * 2, h = Math.floor(m / 60) % 24; return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };

function phoneScreen() {
  if (!S.f.phone_on) return 'The screen is black. (TURN ON PHONE.)';
  let t = `Lock screen: ${phoneTime()}.  Battery: ${S.bat}%${charging() ? ' (charging)' : ''}.\n`;
  t += '\nMESSAGES\n  Mom (5:12 AM): "They called me in early. The hospital is chaos, something is going around. Lock the door and stay home. I will call you. Eat something."\n';
  if (S.moves < 10) t += '  Dani (6:31 AM): "anyone elses feed completely cooked rn??"\n';
  else if (S.moves < 40) t += '  Dani (6:52 AM): "bro my neighbor just BIT the mailman. this is not a bit."\n  Kai (6:55 AM): "ok but why is everyone walking like that"\n';
  else t += '  Dani (7:20 AM): "[Not Delivered]"\n  Kai (7:22 AM): "[Not Delivered]"\n  Group chat "The Girlies and Kevin": 212 unread.\n';
  if (S.f.alert) {
    S.f.pass = 1;
    t += '\nEMERGENCY ALERT - MILLBROOK COUNTY\n  A Level Five contagion outbreak is underway. Do not approach infected persons. Do NOT go to the hospital.\n  Government evacuation sites are open to all civilians:\n' +
      '   1) PIER 9 HARBOR - ferry to Haven Island, a secure, self-sufficient settlement. Show the gate officer the boarding pass on this phone.\n' +
      '   2) BUNKER HALCYON - Mount Kestrel. A deep shelter stocked for years. Enter through the old mine tunnel. Keycard and keypad code are held at the Ranger Station.\n' +
      '   3) FORT MARROW AIRFIELD - helicopter extraction to the fleet. Fire a signal flare from the helipad.\n  [QR] EVAC PASS saved to wallet.';
  } else t += '\n(No new alerts.)';
  return t;
}

// ---------------------------------------------------------------- ROOMS
const rooms = {
  bedroom: { name: 'Your Bedroom', outlet: 1, x: { e: 'hall' },
    desc: 'It is 6:40 on a Friday morning and your room looks like the scene of a crime against productivity: clothes on the floor, a ring light on the desk, a bed you have technically slept in, and a poster of a band you only like ironically. A doorway leads east to the upstairs hall. A window looks out over the street.',
    scn: { 'window street': () => S.moves < 20 ? 'Maple Street looks normal. An SUV is parked crooked at the curb with its door hanging open. Somewhere a dog is barking.' : 'A man in a bathrobe is walking down the middle of Maple Street with his head at the wrong angle. This is not a normal Friday.',
      'clothes floor pile': 'Mostly clean. Probably.', 'desk ring light': () => S.f.power ? 'The ring light is still on. You fell asleep mid-scroll. Again.' : 'The ring light is dark now. Even it has given up.', 'bed': 'Unmade. You will not be making it.', 'poster band': 'A band that broke up before you were born. You like them ironically. And also unironically.' } },
  hall: { name: 'Upstairs Hall', x: { w: 'bedroom', e: 'bathroom', d: 'living' },
    desc: 'A narrow hallway lined with family photos. Your bedroom is to the west, the bathroom to the east, and the stairs lead down.',
    scn: { 'photos photo pictures family': 'Mostly you, photographed against your will at every age. Mom is the one behind the camera.', 'stairs staircase': 'Carpeted. Creaky on the fourth step.' } },
  bathroom: { name: 'Bathroom', outlet: 1, x: { w: 'hall' },
    desc: 'A small bathroom with a mirror, a tub with a shower curtain printed with tiny avocados, and a medicine shelf. The hall is back to the west.',
    scn: { 'mirror': 'You look rough. Dark circles, hoodie hair. Honestly, this is you at your best, apocalypse-wise.', 'tub bath shower curtain': 'The avocados are smiling. You are not.', 'sink toilet shelf': 'Nothing useful. You decide against brushing your teeth. Priorities.' } },
  living: { name: 'Living Room', outlet: 1, x: { u: 'hall', e: 'kitchen', s: () => S.f.barricade ? 'The couch is jammed against the front door from the inside. Try the garage, or PULL the couch back.' : 'front_yard', out: () => S.f.barricade ? 'The couch is jammed against the front door from the inside. Try the garage, or PULL the couch back.' : 'front_yard' },
    desc: 'A couch, a coffee table with three remotes (you know how only one works), and a TV on the wall. The front door is to the south, the kitchen is east, and the stairs go up.',
    scn: { 'table coffee remotes remote': 'You find the right remote on the fourth try. Then remember the TV also has a power button.', 'window curtains': () => S.f.barricade ? 'Through the curtain you see a dark shape bumping slowly into your porch railing.' : 'The front yard looks empty. For now.' } },
  kitchen: { name: 'Kitchen', outlet: 1, x: { w: 'living', e: 'garage' },
    desc: () => 'A tidy kitchen, tidier than usual, because Mom cleaned before her shift. A fridge in the corner ' + (S.f.power ? 'hums' : 'sits silent') + ', covered in magnets. A dish rack sits by the sink. The living room is west and a door east leads to the garage.',
    scn: { 'sink dishes counter': 'Mom\'s one passive-aggressive dish, left to soak.', 'door back window': 'The back window shows the fence and nothing else. Quiet.' } },
  garage: { name: 'Garage', outlet: 1, x: { w: 'kitchen', sw: 'front_yard', out: 'front_yard' },
    desc: 'A cluttered one-car garage. Your Corolla sits dead in the middle, because you left the dome light on again. A workbench runs along one wall. The big door is rolled up halfway, letting daylight in from the southwest. The kitchen is west.',
    scn: { 'car corolla hatchback': 'The battery is dead, the tire is flat, and Maple Street is a parking lot anyway. Walking it is.', 'workbench bench': 'Tools, jars of screws, and a toolbox. Dad\'s old stuff.', 'door garage': 'Rolled up halfway. You could duck out to the southwest.' } },
  front_yard: { name: 'Front Yard', x: { n: () => S.f.barricade ? 'You barricaded the front door from the inside. Try the garage.' : 'living', in: () => S.f.barricade ? 'You barricaded the front door from the inside. Try the garage.' : 'living', ne: 'garage', s: 'maple' },
    desc: 'A small lawn that your mom insists on calling "curb appeal". The front door is to the north, the garage to the northeast, and Maple Street is south. There is a small mailbox here.',
    scn: { 'lawn grass yard': 'Short, green, and soon to be a battlefield.', 'door house': 'The front door leads north into the living room.' } },
  maple: { name: 'Maple Street', x: { n: 'front_yard', w: 'porch', e: 'quik', s: 'main_st' },
    desc: 'A quiet suburban street of identical houses, each with an identical lawn. Your house is to the north. Mrs. Alvarez\'s porch is west, the Quik-Stop stands on the corner to the east, and Main Street runs south. An abandoned SUV sits crooked in the road, door open, its radio murmuring.',
    scn: { 'suv car': 'Keys in the ignition, engine dead, and a half-eaten breakfast burrito on the dash. Someone left in a hurry.', 'houses house street': 'All the curtains are drawn.' } },
  porch: { name: "Mrs. Alvarez's Porch", x: { e: 'maple' },
    desc: 'A neat porch with a welcome mat that says BLESS THIS MESS, three potted plants, and a locked front door with a curtained window. Maple Street is east.',
    scn: { 'mat plants plant': 'The plants are thriving. Mrs. Alvarez has never missed a watering.', 'window curtain curtains': 'The curtain twitches. Someone is watching you.' } },
  quik: { name: 'Quik-Stop', outlet: 1, x: { w: 'maple', out: 'maple', n: 'stockroom' },
    desc: 'A brightly lit convenience store with rows of chips, a coffee machine, and a rack of energy drinks. The checkout counter is abandoned. A door behind it leads north to the stockroom. The street is west.',
    scn: { 'counter register checkout': 'The register drawer is open and empty. A lottery ticket is half-scratched. Priorities.', 'chips snacks shelves rack': 'Entire aisles of salty regret.', 'coffee machine': () => S.f.power ? 'The coffee machine is still on. The glass pot is cold.' : 'The coffee machine is dead. The glass pot is cold.' } },
  stockroom: { name: 'Quik-Stop Stockroom', dark: 1, x: { s: 'quik' },
    desc: 'A cramped stockroom with cases of soda stacked to the ceiling and a metal shelf. The only way out is south.',
    scn: { 'cases soda boxes': 'Cases of off-brand cola. Enough to survive on, if you hate your teeth.', 'shelf': 'A metal shelf with a few forgotten odds and ends.' } },
  main_st: { name: 'Main Street', x: { n: 'maple', w: 'cafe', e: 'hardware', s: 'square' },
    desc: 'Millbrook\'s one "downtown" street: brick storefronts, a vape shop that used to be a bank, and banners for a street fair that won\'t be happening. Maple Street is north. The Brew Haha Cafe is to the west, Handy Hank\'s Hardware to the east, and Town Square lies south.',
    scn: { 'banners banner fair': 'FALL FESTIVAL - COME ONE, COME ALL. Not anymore.', 'shops storefronts vape bank': 'Dark windows. The OPEN signs are all still on.' } },
  cafe: { name: 'Brew Haha Cafe', outlet: 1, x: { e: 'main_st', out: 'main_st' },
    desc: 'An overpriced cafe with mismatched thrift-store chairs, a chalkboard menu, and a sign: "WIFI: espresso123". Half-drunk drinks sit on every table. The door is east.',
    scn: { 'menu chalkboard board': 'Today\'s special: Pumpkin Spice Everything. The last item is crossed out and replaced with "RUN".', 'tables table chairs chair': 'Half-finished oat-milk lattes and a phone left face-down. Whoever sat here left fast.', 'sign wifi': 'You try the password. Connected! Then nothing loads. Of course.' } },
  hardware: { name: "Handy Hank's Hardware", outlet: 1, x: { w: 'main_st', out: 'main_st' },
    desc: 'Narrow aisles of paint, pipe fittings, and bins of screws. A pegboard of tools covers the back wall. The door is west.',
    scn: { 'pegboard tools wall': 'Hammers, wrenches, a lot of things for a normal Saturday.', 'aisles paint bins screws': 'All the screws you could ever want. Not what you need.' } },
  square: { name: 'Town Square', x: { n: 'main_st', w: 'pharmacy', e: 'police', s: 'hospital', se: 'riverside', sw: 'mall', nw: 'park', ne: 'ramp' },
    desc: 'The heart of Millbrook: a dry fountain and a statue of Founder Josiah Millbrook, wearing a traffic cone. A sign reads WELCOME TO MILLBROOK - POP. 14,208 (someone has crossed out the number). Main Street is north. The pharmacy is west, the police station east, and St. Brigid\'s Hospital south. Roads lead southeast to the river, southwest to the Galleria mall, northwest to Greenwood Park, and northeast to the Route 9 on-ramp.',
    scn: { 'statue josiah founder cone': 'Founder Josiah Millbrook, 1802-1871, topped with a traffic cone. A Millbrook tradition. He looks resigned.', 'fountain': 'Dry since the budget cuts. A few coins glint in the dust. Nobody is wishing today.', 'sign': 'WELCOME TO MILLBROOK - POP. 14,208. The number has been scratched out and replaced with a question mark.' } },
  pharmacy: { name: 'Millbrook Pharmacy', x: { e: 'square', out: 'square' },
    desc: 'Shelves of cold medicine, greeting cards, and seasonal candy that has been on sale since August. The pharmacy counter is at the back. The square is east.',
    scn: { 'counter pharmacy shelf shelves': 'A shelf of pickup bags labeled in neat handwriting.', 'cards candy': 'Get Well Soon cards. Ironic.' } },
  police: { name: 'Police Station', x: { w: 'square', out: 'square', d: () => S.f.evid ? 'evidence' : 'The evidence room door at the foot of the stairs is shut tight: reinforced steel, with a heavy lock.' },
    desc: 'The station lobby is ransacked: overturned chairs, a front desk, and a bulletin board of faded notices. A stairwell leads down to the evidence room. The square is west.',
    scn: { 'desk front': 'The sergeant\'s coffee is still warm. That is concerning.', 'board bulletin notices': 'MISSING: tabby cat "Biscuit"? No, wait, that\'s a dog. A different dog. The handwriting is shaky.', 'stairs stairwell': 'The stairs go down to a steel door.' } },
  evidence: { name: 'Evidence Room', dark: 1, x: { u: 'police' },
    desc: 'Rows of metal shelves, evidence bags, and labelled boxes. Everything the Millbrook PD ever confiscated is down here, mostly illegal fireworks. The stairs go up.',
    scn: { 'shelves shelf boxes bags': 'Labelled evidence bags. Mostly illegal fireworks, a lot of vapes, and a flare gun case in the corner.' } },
  hospital: { name: "St. Brigid's Hospital Lobby", x: { n: 'square', e: 'staff', w: 'ward' },
    desc: 'The sliding doors are stuck open. Overturned gurneys, scattered clipboards, and a lot of dark stains on the white floor. A sign points east to STAFF ONLY, and the ward wing is west. The square is north.',
    scn: { 'gurney gurneys gurneys': 'Empty, and not by choice.', 'clipboards clipboard': 'Patient notes: "fever, aggression, tried to bite triage nurse." That last one is underlined.', 'sign': 'STAFF ONLY, with an arrow east.', 'stains stain floor': 'You look away.' } },
  staff: { name: 'Nurses\' Staff Room', outlet: 1, x: { w: 'hospital', out: 'hospital' },
    desc: 'A break room with a mini-fridge, a corkboard, and a row of lockers. One locker has your mom\'s name on it, in her handwriting. The lobby is west.',
    scn: { 'fridge': 'Someone\'s lunch has a label: "DO NOT TOUCH, DEBRA".', 'corkboard board': 'Staff roster, a flyer for a pizza party. "Mandatory fun."', 'lockers': 'A row of grey lockers. Your mom\'s is easy to spot: it has a sticker of you at age six.' } },
  ward: { name: "St. Brigid's Ward", x: { e: 'hospital' },
    desc: 'A long ward of curtained beds, most of them empty, one of them very much not. Charts hang from rails, an IV stand lies on its side, and the lights buzz at half strength. The lobby is east.',
    scn: { 'beds bed curtains curtain': 'You check the occupied bed from a safe distance. Then you stop checking.', 'charts chart': 'Every chart ends with the same underlined word: BITTEN.', 'iv stand': 'The bag is long empty.', 'figure body delgado': 'A man in a police uniform, half out of bed, very still. His badge is missing; it must have fallen.' } },
  mall: { name: 'Galleria Mall Atrium', x: { ne: 'square', e: 'electronics', w: 'sports', s: 'foodcourt' },
    desc: 'The mall is eerily quiet. The skylights spill light onto a frozen escalator and a fountain filled with pennies and one abandoned stroller. Zap! Electronics is east, Sports Depot is west, and the food court is south. The exit to the square is northeast.',
    scn: { 'fountain pennies': 'Full of wishes. None of them came true.', 'escalator': 'Frozen mid-ride. Nobody is on it.', 'stroller': 'Empty. You decide not to think about it.', 'skylights skylight': 'Bright. It does not match the mood.' } },
  electronics: { name: 'Zap! Electronics', outlet: 1, x: { w: 'mall', out: 'mall' },
    desc: () => (S.f.power ? 'Walls of TVs, all showing the same emergency broadcast on a dozen different brands.' : 'Walls of dead TVs, each reflecting your own tired face.') + ' A demo table displays gadgets. The mall atrium is west.',
    scn: { 'tvs tv television': () => S.f.power ? 'The same newscaster, in a dozen different colour profiles. She has stopped blinking.' : 'Dark screens. You can see yourself in them, which is worse.', 'table demo gadgets': 'Smartwatches, earbuds, drones, and one extremely loud speaker.' } },
  sports: { name: 'Sports Depot', x: { e: 'mall', out: 'mall' },
    desc: 'Aisles of team jerseys, treadmills, and camping gear. A wall of hockey sticks and baseball bats lines the back. The mall atrium is east.',
    scn: { 'jerseys jersey': 'Sizes S through XXL. All sold out of anything fashionable.', 'treadmill treadmills': 'Nobody is running. That is the problem.', 'camping gear tents': 'A display tent with a sign: "FOR THE ADVENTURER IN YOU". Okay.' } },
  foodcourt: { name: 'Galleria Food Court', outlet: 1, x: { n: 'mall', w: 'arcade' },
    desc: 'A wide food court ringed by shuttered stalls: a pizza counter, a noodle bar, and a smoothie place called Just Kale It. Trays and chairs are scattered everywhere. The atrium is north and an arcade glows to the west.',
    scn: { 'stalls stall pizza noodle noodles': 'All shuttered, except the noodle bar, which has been recently disturbed.', 'trays chairs tables': 'A food fight happened here. Or the other thing.', 'smoothie kale': 'Just Kale It. Someone already did.' } },
  arcade: { name: 'Galaxy Warp Arcade', outlet: 1, x: { e: 'foodcourt' },
    desc: () => 'A dim arcade of dead cabinets, one of which ' + (S.f.power ? 'still blinks INSERT COIN in cheerful green' : 'sits dark, its INSERT COIN long gone') + '. Prize tickets spill from a busted machine like a paper waterfall. The food court is east.',
    scn: { 'cabinets cabinet games': 'Racing games, light-gun games, and a claw machine full of plush zombies. Prescient.', 'tickets ticket': 'Thousands of them. Finally enough for the plastic vampire fangs.', 'claw plush': 'A claw machine full of plush zombies. Someone knew.' } },
  riverside: { name: 'Riverside Walk', x: { nw: 'square', e: 'harbor', n: 'skate' },
    desc: 'A jogging path along the slow, brown Millbrook River. Gulls scream overhead. Harbor Road continues east toward the docks, and the Millbrook Skate Park is just north. A road leads northwest back to the square.',
    scn: { 'river water': 'Slow and brown. You do not want to know what is in it.', 'gulls gull birds': 'Screaming, like the rest of the town.', 'path': 'A jogging path. Nobody jogs today.' } },
  skate: { name: 'Millbrook Skate Park', x: { s: 'riverside', se: 'harbor' },
    desc: 'Concrete bowls, rails, and a half-pipe covered in layers of graffiti. The park is empty. The river path is south, and a gap in the fence leads southeast to Harbor Road.',
    scn: { 'bowl bowls rails rail halfpipe ramp': 'Dozens of tags, a few memorial ones. You remember kids learning to kickflip here. You never did.', 'graffiti tags': 'Tags layered on tags. One says "STAY WEIRD". Another, newer: "THEY\'RE COMING".' } },
  harbor: { name: 'Harbor Road', x: { w: 'riverside', nw: 'skate', e: 'pier_gate' },
    desc: 'A wide road lined with shipping containers, closed seafood shacks, and a rusted chain-link fence. The smell of salt and something worse hangs in the air. The river path is west, a gap in the fence leads northwest to the skate park, and the Pier 9 gate is east.',
    scn: { 'containers container': 'Stacked three high. A good place for something to be hiding.', 'fence chain-link': 'The fence is dented in places, as if someone pushed against it. Hard.' } },
  pier_gate: { name: 'Pier 9 Gate', x: { w: 'harbor', e: () => S.f.gate ? 'pier' : 'The gate is shut. The guard shakes his head. "Pass first."' },
    desc: 'A steel gate topped with razor wire guards the entrance to Pier 9. A grim-faced guard in a hi-vis vest watches from behind a barrier, a clipboard in one hand and a rifle slung over his shoulder. Beyond the gate you can see the pier, and a white ferry waiting. Harbor Road is west.',
    scn: { 'gate fence wire barrier': () => S.f.gate ? 'The gate is open. Beyond it, the pier.' : 'A heavy steel gate with razor wire. Behind it, the pier and the boat.', 'ferry boat pier': 'You can see it from here: a white ferry with a red stripe, engines idling.', 'clipboard': 'A manifest of names. Yours is not on it. Yet.' } },
  pier: { name: 'Pier 9', x: { w: 'pier_gate' },
    desc: 'A long wooden pier stretches into the grey water. A white ferry, the SEA HAVEN, idles at the end. Weary survivors sit on duffel bags, and a deckhand waves people up a gangway. The gate is west.',
    scn: { 'survivors people crowd': 'Maybe fifty people, quiet and exhausted. Some are crying. Some are asleep standing up.', 'gangway deckhand': 'A deckhand in an orange vest, ticking names off a list. "Keep it moving," he says, gently.', 'water': 'Cold and dark. The far shore is just a smudge.' } },
  park: { name: 'Greenwood Park', x: { se: 'square', n: 'trailhead', e: 'pond' },
    desc: 'A big, shady park with a playground, picnic tables, and a duck pond to the east. A trail leads north toward Mount Kestrel. A road goes southeast to the town square.',
    scn: { 'playground swings swing slide': 'The swings are still moving, slightly.', 'pond ducks duck': 'The ducks are gone. Or avoiding the topic.', 'tables picnic': 'A picnic abandoned mid-meal. A sandwich with one bite.' } },
  pond: { name: 'Duck Pond', x: { w: 'park' },
    desc: 'A scummy pond with a leaning bench and a shopping trolley poking out of the water like a shipwreck. No ducks. The park is west.',
    scn: { 'trolley cart': 'Every pond has one. Nobody knows how. Nobody ever will.', 'bench': 'A plaque reads: IN MEMORY OF GERALD, WHO FED THE DUCKS. Gerald is not here either.', 'water ducks duck': 'Something ripples once, far out. You decide it was a fish.' } },
  trailhead: { name: 'Kestrel Trailhead', x: { s: 'park', n: 'switchback' },
    desc: 'A gravel lot and a wooden signboard where the trail begins. Mount Kestrel looms to the north, grey rock and dark pine. The park is south.',
    scn: { 'sign signboard board map': 'KESTREL TRAIL - RANGER STATION 1.2 MI. Someone has added: "HALCYON, GO LEFT AT THE MINE" in marker, and then thought better of it and scribbled it out.', 'mountain mount kestrel': 'Grey, forested, and quiet. A good place to hide.' } },
  switchback: { name: 'Switchback Trail', x: { s: 'trailhead', e: 'lookout', n: () => S.f.ranger ? 'ranger' : 'The Ranger Station door at the top of the trail is locked, a heavy dead-bolt.' },
    desc: 'The trail zigzags up the mountainside through dark pines. At the top stands a stout log building with a green roof: the Ranger Station. A weathered sign hangs on its door. A wooden lookout platform juts from the slope to the east. The trailhead is south.',
    scn: { 'pines trees pine': 'Tall, dark, and quiet. You can almost hear the mountain breathing.', 'building station roof': 'A log cabin with a green roof, the Ranger Station. Its door is shut.' } },
  lookout: { name: 'Kestrel Lookout', x: { w: 'switchback' },
    desc: 'A wooden platform above the treeline with a coin-op telescope and a view of all of Millbrook: the river, the mall, and thin smoke rising in three places. The trail is west.',
    scn: { 'telescope': 'It wants a dollar. You look anyway, because the apocalypse has loosened its coin mechanism. The town looks small and quiet, which is somehow worse.', 'view town smoke': 'Three columns of smoke: downtown, the hospital, and somewhere near your street.' } },
  ranger: { name: 'Ranger Station', outlet: 1, x: { s: 'switchback', n: 'mine' },
    desc: 'A cosy cabin with a woodstove, a wall map of Mount Kestrel, and a gun rack, empty. A desk sits under the window. A dark doorway leads north into the old mine tunnel. The door south leads back to the trail.',
    scn: { 'map wall': 'Mount Kestrel, hand-drawn: trails, the old Kestrel Mine, and a mark labelled "H" deep in the mountain, circled twice.', 'stove woodstove': 'Cold. Nobody has been here in days.', 'desk window': 'Neatly organised. The ranger was a tidy person.', 'rack gun': 'Empty. They took it with them.' } },
  mine: { name: 'Old Mine Tunnel', dark: 1, x: { s: 'ranger', n: 'bunker_door' },
    desc: 'A long, timber-braced tunnel descending into the mountain. Rusted rails run along the floor, and the air is cold and smells of stone. The tunnel continues north. The ranger station is south.',
    scn: { 'rails rail track': 'Rusty narrow-gauge mine rails.', 'timber beams braces': 'Black with age.' } },
  bunker_door: { name: 'Halcyon Gate', x: { s: 'mine', n: () => S.f.swiped && S.f.coded ? 'END_BUNKER' : 'The blast door is sealed.' },
    desc: 'The tunnel ends in a perfectly smooth concrete wall, in the middle of which is a massive steel blast door, three feet thick, with a green HALCYON logo. Beside it is a keypad and a card slot, both glowing patiently. The tunnel leads south.',
    scn: { 'door blast': () => S.f.swiped && S.f.coded ? 'The door stands open. Warm light spills from inside.' : 'A gigantic blast door. It looks like it could survive anything, which is the point.', 'logo halcyon': 'A green HALCYON logo, a stylised bird. "Peace for generations," it says.' } },
  ramp: { name: 'Route 9 On-Ramp', x: { sw: 'square', e: 'afgate' },
    desc: 'Cars are jammed bumper to bumper up the ramp, doors open, engines dead. A stranded sedan sits in the middle with its trunk open. A road sign points east to FORT MARROW AIRFIELD. The town square is southwest.',
    scn: { 'cars car sedan': 'Abandoned. Doors open. A child\'s drawing is taped to a back window.', 'sign': 'FORT MARROW AIRFIELD - EAST. A hastily painted arrow adds "FLY OUT!"', 'trunk': 'Empty apart from a spare tyre and a lot of dust.' } },
  afgate: { name: 'Fort Marrow Gate', x: { w: 'ramp', e: () => S.f.chain ? 'hangar' : 'A heavy chain with a padlock the size of your fist holds the gate shut.' },
    desc: 'A chain-link gate, topped with barbed wire, closes off the airfield. A thick chain and padlock secure it. Beyond, you can see an open hangar and a helipad. The on-ramp is west.',
    scn: { 'gate fence wire': 'Chain-link and barbed wire. The kind of gate that wants to be left alone.', 'airfield hangar helipad': 'Through the fence you see a big hangar and a helipad beyond it. Nothing moves.' } },
  hangar: { name: 'Hangar 3', x: { w: 'afgate', e: 'helipad' },
    desc: 'A vast hangar with a high ceiling, crates of equipment, and a jeep with its door hanging open. Open bay doors to the east lead to the helipad. The gate is west.',
    scn: { 'crates crate equipment': 'Military crates, stamped and sealed. You are not qualified for any of it.', 'jeep': 'Abandoned, key in ignition, door open. Great, if you were going anywhere on wheels.' } },
  helipad: { name: 'Helipad', x: { w: 'hangar' },
    desc: 'A broad concrete pad painted with a big white H. Beyond it, a fence, then fields. The sky is huge and empty. The hangar is west.',
    scn: { 'pad h helipad': 'A big white H. Waiting.', 'sky': 'Huge and empty. No helicopters. Yet.', 'fence fields': 'Fields of dry grass, gold in the sun. Quiet and strange.' } }
};

// ---------------------------------------------------------------- ITEMS
const items = {
  phone: { n: 'your phone', al: 'phone smartphone iphone cell mobile screen', at: 'bedroom', lst: () => S.at.charger === 'bedroom' ? 'Your phone sits on the nightstand, plugged in to its charger.' : 'Your phone sits on the nightstand.',
    d: () => 'Your phone, in a cracked rose-gold case covered in stickers. ' + phoneScreen(),
    on: { switchon: () => { if (S.bat <= 0) return 'Nothing happens. It is dead.'; if (S.f.phone_on) return 'It is already on.'; S.f.phone_on = 1; return 'The screen lights up.'; }, switchoff: () => { S.f.phone_on = 0; return 'The screen goes dark. Battery saved.'; }, use: () => 'Your phone, in a cracked rose-gold case. ' + phoneScreen() } },
  charger: { n: 'a phone charger', al: 'charger cable cord charging', at: 'bedroom', lst: '', d: 'A white wall charger with a frayed cable you have been meaning to replace since 2022. It only works where there is an outlet and power.', on: { use: () => { V.plug.fn(null, null, {}); return true; } } },
  hoodie: { n: 'an oversized hoodie', al: 'hoodie sweatshirt sweater hood', at: 'bedroom', wear: 1, armor: 1, lst: 'An oversized hoodie hangs off the desk chair.',
    d: 'Heather grey, enormous, and thick enough to count as armour. "TOUCH GRASS" is printed on one sleeve. Ironically, that is now the plan.' },
  backpack: { n: 'a backpack', al: 'backpack bag pack rucksack', at: 'bedroom', lst: 'Your backpack slumps in the corner.', cont: 1, open: 1, pts: ['pack', 1], d: 'A sturdy backpack covered in enamel pins. It holds about eight things.', on: { use: () => 'Try PUT something IN the backpack.' } },
  airpods: { n: 'a pair of earbuds', al: 'airpods earbuds earphones buds headphones case', at: 'bedroom', lst: 'A pair of earbuds sits on the desk.', d: 'Your earbuds. The case is at 3%. Not much help, but noise-cancelling would be nice right now.',
    on: { wear: () => 'You pop them in. The world goes pleasantly silent, and instantly you remember that is a terrible idea right now. You take them out.' } },
  firstaid: { n: 'a first-aid kit', al: 'first aid kit firstaid medkit', at: 'bathroom', lst: 'A first-aid kit sits on the shelf.', pts: ['kit', 2], d: 'A red plastic box with a white cross. Bandages, antiseptic, tape. Enough for one good patch-up.',
    on: { use: () => healKit('firstaid', 2) } },
  note: { n: 'a sticky note', al: 'note sticky paper', at: 'kitchen', lst: 'A sticky note is stuck to the fridge door.', read: 1, pts: ['note', 2],
    d: 'In Mom\'s handwriting: "Kiddo - hospital called me in early, something\'s going on. Door locked, stay inside, I\'ll call. There\'s pad thai in the fridge. Don\'t forget to eat. Love you. - Mom xx"' },
  fridge: { n: 'the fridge', al: 'fridge refrigerator', at: 'kitchen', lst: '', fixed: 1, cont: 1, d: 'A stainless-steel fridge covered in magnets.' },
  drink: { n: 'an energy drink', al: 'drink energy can gnarly blue', at: 'in:fridge', eat: 'You crack it open and drink it in one go. Your heart does a drum solo. You feel capable of anything, which is the effect of 160mg of caffeine and nothing else.', heal: 1, d: 'A neon blue can of GNARLY BLUE energy. "Not recommended for anyone."' },
  padthai: { n: 'some leftover pad thai', al: 'pad thai leftover leftovers food takeout container', at: 'in:fridge', eat: 'Cold, glorious, and strangely emotional. A little of Mom in every bite. You feel better.', heal: 1, d: 'Mom\'s pad thai, in a container labelled "EAT ME" in her handwriting.' },
  knife: { n: 'a kitchen knife', al: 'knife kitchen blade', at: 'kitchen', lst: 'A kitchen knife is in the dish rack.', wp: { msg: 'You jab the knife into the zombie\'s skull, hard. It drops, but not before it grabs you.', risk: 1 }, d: 'A sharp chef\'s knife. Close-quarters, risky.',
    on: { tape: () => makeSpear() } },
  tv: { n: 'the TV', al: 'tv television news screen', at: 'living', lst: '', fixed: 1, d: 'A big flat-screen TV, currently off.',
    on: { switchon: () => { if (!S.f.power) return 'You press the power button. Nothing. The power is out.'; aw('tv', 3); return 'The TV blinks on mid-sentence. A news anchor with a crooked tie is reading from paper, because the teleprompter has died: "- repeat, a Level Five contagion event is in progress in Millbrook County. Remain indoors. Do not approach anyone showing signs of aggression, fever, or an unusual gait. A map flashes with three glowing pins: PIER 9 HARBOR, MOUNT KESTREL, FORT MARROW AIRFIELD. Evacuation passes have been pushed to all phones in the county." The anchor looks off-camera, goes pale, and the feed cuts to a test pattern.'; }, switchoff: () => 'You switch it off. The silence is worse.', use: () => items.tv.on.switchon() } },
  couch: { n: 'the couch', al: 'couch sofa', at: 'living', lst: '', fixed: 1, d: 'A large, deep couch that has seen too many movie marathons. It looks heavy enough to block a door.',
    on: { use: () => barricade(), push: () => barricade(), pull: () => { if (!S.f.barricade) return 'It is already where it belongs.'; S.f.barricade = 0; return 'You drag the couch back across the floor. The front door is accessible again.'; } } },
  frontdoor: { n: 'the front door', al: 'door front', at: 'living', lst: '', fixed: 1, d: 'Your front door. The deadbolt is thrown back, and it opens south into the front yard. Locks do not mean much right now.', on: { push: () => barricade(), open: () => 'It is already unlocked. You can go south.' } },
  bat: { n: 'a baseball bat', al: 'bat baseball aluminum club', at: 'garage', lst: 'A baseball bat leans against the wall.', pts: ['weapon', 3], wp: { msg: 'You swing the bat with everything you have. The zombie\'s head snaps sideways and it goes down. Quiet again.' }, d: 'A dented aluminium bat, bruised from many seasons of Little League. Reassuringly heavy.' },
  toolbox: { n: 'a toolbox', al: 'toolbox box tool tools', at: 'garage', lst: 'A red toolbox sits on the workbench.', fixed: 1, cont: 1, d: 'A dented red metal toolbox with a rusty latch.' },
  crowbar: { n: 'a crowbar', al: 'crowbar pry bar', at: 'in:toolbox', pts: ['crowbar', 2], wp: { msg: 'You bring the crowbar down hard on the zombie. It stops moving.' }, d: 'A heavy steel crowbar. Good for prying open things. Or skulls.', on: { use: () => { const d = ['edoor', 'rdoor'].find(vis); return d ? items[d].on.pry() : 'Nothing here needs prying. (You can also ATTACK a zombie with it.)'; } } },
  mailbox: { n: 'the mailbox', al: 'mailbox mail box', at: 'front_yard', lst: '', fixed: 1, cont: 1, d: 'A small mailbox with a flag. The flag is up.' },
  leaflet: { n: 'a leaflet', al: 'leaflet pamphlet flyer brochure paper', at: 'in:mailbox', read: 1, pts: ['leaflet', 2],
    d: 'COUNTY OFFICE OF EMERGENCY PREPAREDNESS - "BE READY, MILLBROOK!" In the event of a Level Five emergency, three shelters will open:\n  1. HAVEN ISLAND (via Pier 9 Harbor) - ferry service. Your phone will receive a digital boarding pass.\n  2. BUNKER HALCYON, Mount Kestrel - entrance through the old mine tunnel. Park rangers hold the access codes.\n  3. FORT MARROW AIRFIELD - helicopter extraction. Signal with a flare at the helipad.\nPlease do not call the number on this leaflet; it is not staffed and never was.' },
  suvradio: { n: 'the SUV radio', al: 'radio suv', at: 'maple', lst: '', fixed: 1, d: 'The SUV\'s radio is on, murmuring.', on: { listen: () => { aw('radio', 2); return 'You lean into the SUV. A calm voice repeats on a loop: "Evacuation sites are OPEN. Pier 9 Harbor. Bunker Halcyon, Mount Kestrel. Fort Marrow Airfield. Remain calm. Rangers hold the Halcyon codes. A digital pass has been sent to your phone. Remain calm."'; } } },
  mrs: { n: 'Mrs. Alvarez', al: 'mrs alvarez woman lady neighbor door', at: 'porch', lst: '', fixed: 1, d: 'You can just see her face in the gap of the curtain: elderly, worried, and very much alive.',
    on: { talk: () => mrsTalk(), knock: () => mrsTalk(), give: b => mrsGive(b) } },
  biscuit: { n: 'Biscuit the corgi', al: 'biscuit dog corgi', at: 'nowhere', lst: 'Biscuit the corgi trots along at your heels.', always: 1, fixed: 1, d: 'A rotund corgi with the confidence of a much larger dog. His tail is a blur.',
    on: { pet: () => 'You scratch behind his ears. Biscuit exhales with his whole body.', talk: () => 'Biscuit sits and listens like you are the most interesting person alive.' } },
  water: { n: 'a bottle of water', al: 'water bottle', at: 'quik', lst: 'A bottle of water sits on the counter.', eat: 'You drink. Cold, clean, and nothing special. It tastes like survival.', d: 'A plastic bottle of spring water, cold.' },
  chips: { n: 'a bag of chips', al: 'chips bag snack crunchos', at: 'quik', lst: 'A bag of FLAMIN\' HOT CRUNCHOS sits on a shelf.', eat: 'You crunch through them. Spicy. Your fingers are now radioactive orange. You do not regret it.', heal: 1, d: 'FLAMIN\' HOT CRUNCHOS. The bag is huge. The flavour is "mostly red".' },
  bank: { n: 'a power bank', al: 'power bank battery portable charger powerbank', at: 'stockroom', lst: 'A portable power bank lies on a shelf.', pts: ['bank', 2], d: () => S.f.bankUsed ? 'A drained power bank.' : 'A chunky ChargeBuddy portable battery. The little lights say it is full.',
    on: { use: () => usePower('bank') } },
  bandage: { n: 'a box of adhesive bandages', al: 'bandage bandages bandaid box adhesive', at: 'pharmacy', lst: 'A box of adhesive bandages is on the floor.', d: 'A box of adhesive bandages. Enough for one patch job.', on: { use: () => healKit('bandage', 1) } },
  pills: { n: "Mrs. Alvarez's prescription bag", al: 'pills bag prescription alvarez medicine digoxin', at: 'pharmacy', lst: 'A paper bag on the pickup shelf is stapled shut and labelled ALVAREZ, ROSA.', pts: ['pills', 3], d: 'A white paper bag stapled shut: ALVAREZ, ROSA - DIGOXIN, 0.125MG. Heart medication, taken daily. Mrs. Alvarez from the end of the street.' },
  hammer: { n: 'a claw hammer', al: 'hammer claw', at: 'hardware', lst: 'A claw hammer hangs on the pegboard.', pts: ['weapon', 3], wp: { msg: 'You bring the hammer down on the zombie. It stops moving.' }, d: 'A solid claw hammer. Better than nothing.' },
  cutters: { n: 'a pair of bolt cutters', al: 'bolt cutters boltcutters cutters', at: 'hardware', lst: 'A pair of bolt cutters hangs on the pegboard.', pts: ['cutters', 2], d: 'Heavy-duty bolt cutters with red rubber handles. For when a padlock stands between you and the future.', on: { use: () => vis('chain') ? items.chain.on.cut() : 'There is nothing here to cut.' } },
  latte: { n: 'a cold oat latte', al: 'latte coffee oat cup', at: 'cafe', lst: 'A cold oat latte sits on a table.', eat: 'Lukewarm, over-sweet, and absolutely worth it. A small win in a bad week.', d: 'An oat milk latte, half-finished, with heart latte art long gone.' },
  nightstick: { n: 'a nightstick', al: 'nightstick baton club', at: 'police', lst: 'A nightstick lies on the front desk.', pts: ['weapon', 3], wp: { msg: 'You crack the nightstick across the zombie\'s skull. It drops.' }, d: 'A standard-issue police baton. Solid, and comforting to hold.' },
  flaregun: { n: 'a flare gun', al: 'flare gun flaregun signal', at: 'evidence', lst: 'A bright orange flare gun sits in an evidence bag tagged "EXHIBIT 14B: SPRING BREAK, PIER 9".', pts: ['flare', 4], d: 'A bright orange flare gun, already loaded. Evidence tag: "Exhibit 14B". It will definitely be used for evidence, in a sense.',
    on: { fire: () => fireFlare(), use: () => fireFlare() } },
  locker: { n: "your mom's locker", al: 'locker mom moms mothers', at: 'staff', lst: '', fixed: 1, cont: 1, d: 'A grey metal locker with "MOM (M. TORRES, RN)" on a label, and a sticker of you at age six, missing a front tooth.' },
  momnote: { n: "Mom's note", al: 'note mom moms letter paper', at: 'in:locker', read: 1, pts: ['mom', 6],
    d: 'On a torn piece of chart paper, in her handwriting: "Kiddo - they are evacuating staff and families to Pier 9. A boat to Haven Island. I\'m going with the convoy. Find me there. My phone is dead because I forgot my charger, as always. I love you. Eat something. - Mom." There is a lipstick kiss in the corner.' },
  speaker: { n: 'a Bluetooth speaker', al: 'speaker bluetooth boombox boomblast', at: 'electronics', lst: 'A BoomBlast Bluetooth speaker sits on the demo table, fully charged.', pts: ['speaker', 2],
    d: () => S.f.spk ? 'The BoomBlast is blasting a slowed-and-reverb track at ear-splitting volume.' : 'A chunky BoomBlast Bluetooth speaker. Rated for "outdoor stadium use". It is probably loud enough to wake the dead. Literally.',
    on: { use: () => items.speaker.on.switchon(), switchon: () => { S.f.spk = 1; S.f.spk_t = 0; return 'You tap it. It immediately blasts a slowed-and-reverb remix of a song that should not exist, at maximum volume. Every dead thing in a half-mile turns its head.'; }, switchoff: () => { S.f.spk = 0; return 'You turn it off. The silence rings.'; } } },
  hockey: { n: 'a hockey stick', al: 'hockey stick', at: 'sports', lst: 'A hockey stick leans against the wall.', pts: ['weapon', 3], wp: { msg: 'You swing the hockey stick like a slapshot. The zombie\'s head leaves the conversation.' }, d: 'A composite hockey stick. Long reach and lightweight, which is exactly what you want.' },
  protein: { n: 'a protein bar', al: 'protein bar energy snack', at: 'sports', lst: 'A protein bar is on the checkout counter.', eat: 'Chalky, and tastes like a vanilla-flavoured brick. You feel healthier anyway.', heal: 1, d: 'A "CHOCOLATE FUDGE" protein bar. Mostly chalk.' },
  skateboard: { n: 'a skateboard', al: 'skateboard board skate', at: 'skate', lst: 'A skateboard lies abandoned at the foot of the half-pipe.', d: 'A well-worn skateboard, stickers peeling.', on: { ride: () => { return 'You attempt a kickflip. The skateboard goes one way and you go the other. A distant gull judges you silently.'; } } },
  maya: { n: 'Maya', al: 'maya girl teen teenager barista kid', at: 'foodcourt', lst: 'A teenager in a Zap! Electronics hoodie is holed up behind the noodle bar counter, gripping a soup ladle.', fixed: 1,
    d: 'Maybe fifteen, eyes huge, holding the ladle like a sword. Her name tag says MAYA - ASK ME ABOUT TABLETS.',
    on: { talk: () => mayaTalk(), give: g => mayaGive(g) } },
  reyes: { n: 'Officer Reyes', al: 'officer reyes policewoman cop police', at: 'police', lst: () => S.z.police > 0 ? 'Officer Reyes is pinned behind a tipped-over filing cabinet, her pistol empty, shouting at the zombies to back off.' : 'A police officer has barricaded herself behind a tipped-over filing cabinet. Her tag reads R. REYES.', fixed: 1,
    d: 'Mid-thirties, cropped hair, eyes that have seen the whole thing. She keeps her pistol low but ready.',
    on: { talk: () => reyesTalk(), give: g => reyesGive(g) } },
  sam: { n: 'an injured hiker', al: 'sam hiker man guy', at: 'lookout', lst: 'A hiker sits against the telescope pedestal with one leg stuck out straight, wincing.', fixed: 1,
    d: 'Twenty-something, trail runners, a very swollen ankle. He gives you a weak thumbs up.',
    on: { talk: () => samTalk(), give: g => samGive(g) } },
  bank2: { n: 'a ChargePod mini bank', al: 'chargepod pod minibank', at: 'nowhere', pts: ['bank2', 2],
    d: () => S.f.bank2Used ? 'A drained ChargePod.' : 'A slim ChargePod mini power bank, display model, still in its shrink-wrap. Fully charged.',
    on: { use: () => usePower('bank2') } },
  solar: { n: 'a folding solar charger', al: 'solar panel solarpanel suncharger charger', at: 'nowhere', pts: ['solar', 2],
    d: () => S.f.solarUsed ? 'A folding solar panel. It needs a long rest in the sun now.' : 'A folding solar panel the size of a paperback. It drinks sunshine, slowly.',
    on: { use: () => useSolar() } },
  badge: { n: 'a police badge', al: 'badge delgado shield', at: 'ward', lst: 'A police badge glints on the floor by the occupied bed.', pts: ['badge', 2],
    d: 'A heavy Millbrook PD badge, the name plate reading D. DELGADO. The pin is bent, like it was pulled at.' },
  coins: { n: 'a handful of pennies', al: 'pennies coins change cents', at: 'mall', lst: 'A few pennies glint in the fountain.',
    d: 'A fistful of fountain pennies, each one a wish somebody made. You are now the custodian of several wishes.',
    on: { put: b => b && b.id === 'machine' ? playMachine() : undefined, use: () => vis('machine') ? playMachine() : 'You need something to put them in.' } },
  machine: { n: 'an arcade cabinet', al: 'machine game arcadecabinet', at: 'arcade', lst: '', fixed: 1,
    d: () => S.f.power ? 'GALAXY WARP, a cabinet older than you. The screen blinks INSERT COIN. The high score belongs to ASS.' : 'GALAXY WARP, a cabinet older than you. The screen is dead black. The high score, wherever it is, still belongs to ASS.',
    on: { use: () => 'The coin slot stares back at you. It wants a coin. (PUT COINS IN MACHINE.)' } },
  ducttape: { n: 'a roll of duct tape', al: 'duct tape roll gaffer', at: 'hardware', lst: 'A roll of duct tape sits in a bin of washers.',
    d: 'The silver kind. The correct kind. Fixes everything except the current situation.', on: { tape: () => makeSpear(), use: () => makeSpear() } },
  pipe: { n: 'a length of steel pipe', al: 'pipe steel plumbing length', at: 'hardware', lst: 'A length of steel pipe leans in the plumbing aisle.',
    d: 'About five feet of galvanised steel pipe. Heavy and awkward on its own, but it is long, straight, and exactly the right width to tape something sharp to.', on: { tape: () => makeSpear() } },
  spear: { n: 'a makeshift spear', al: 'spear pipe lance', at: 'nowhere', wp: { msg: 'You drive the spear in at full extension. The zombie drops, and you never had to get close. That was the whole point.' },
    d: 'A kitchen knife taped to a length of steel pipe with heroic amounts of duct tape. Range: better than hugging.' },
  guard: { n: 'the guard', al: 'guard officer man soldier', at: 'pier_gate', lst: '', fixed: 1, d: 'A tired man in a hi-vis vest, a rifle slung over his shoulder and a tablet scanner in one hand. He is polite in the way of someone who has been told not to shoot anybody unless necessary.',
    on: { talk: () => S.f.gate ? '"Go on through, kid. Mind the gangway."' : '"Boarding pass. Show me your phone. No pass, no boat. I wish I could do otherwise."', give: b => guardShow(b) } },
  boat: { n: 'the ferry', al: 'boat ferry ship sea haven', at: 'pier', lst: '', fixed: 1, go: 'END_DOCK', on: { use: () => win('END_DOCK') }, d: 'A white ferry with a red stripe. SEA HAVEN, in neat black letters. Its deck rail is crowded with tired faces.' },
  logbook: { n: "the ranger's logbook", al: 'logbook log book ranger ledger', at: 'ranger', lst: "A ranger's logbook lies open on the desk.", read: 1, pts: ['log', 3],
    d: 'The final entry, in shaky capitals: "H. ALVAREZ, CHIEF RANGER. If you are reading this you found the station. HALCYON GATE: swipe the staff keycard (I left it on the desk, next to this book) and enter code 6174 on the keypad. The tunnel is dark - bring a light. God help us all."' },
  keycard: { n: 'a Halcyon keycard', al: 'keycard card halcyon staff', at: 'ranger', lst: 'A green HALCYON keycard sits on the desk.', pts: ['card', 3], d: 'A green plastic card with a gold chip. HALCYON PROJECT - STAFF ACCESS. A bird logo.',
    on: { use: () => swipe() } },
  rangerkey: { n: 'a ranger station key', al: 'key ranger station kestrel', at: 'nowhere', d: 'A heavy brass key on a leather tag. "KESTREL STN". Hector Alvarez\'s, once.' },
  rdoor: { n: 'the station door', al: 'door lock deadbolt station', at: 'switchback', lst: '', fixed: 1, d: () => S.f.ranger ? 'The Ranger Station door stands open.' : 'A heavy oak door with a dead-bolt. A small sign reads AUTHORIZED PERSONNEL ONLY.',
    on: { open: () => rangerDoor(), unlock: () => rangerDoor(), pry: b => { if (S.f.ranger) return 'It is already open.'; if (!hasTool(b, 'crowbar')) return 'You need something to pry with.'; S.f.ranger = 1; aw('rdoor', 1); return 'You jam the crowbar in and heave. The door cracks open with a splintering sound.'; } } },
  edoor: { n: 'the evidence room door', al: 'door lock evidence steel', at: 'police', lst: '', fixed: 1, d: () => S.f.evid ? 'The evidence room door is pried open.' : 'A heavy steel door with a reinforced lock. A crowbar would do it.',
    on: { open: () => S.f.evid ? 'It is open.' : 'It is locked solid. You will need to force it.', unlock: () => 'No key. You could pry it with the right tool.', pry: b => { if (S.f.evid) return 'It is already open.'; if (!hasTool(b, 'crowbar')) return 'You need something strong to pry with.'; S.f.evid = 1; aw('evid', 2); return 'You jam the crowbar into the doorframe and lean on it. The lock shrieks, and the door swings open, revealing a dark room.'; } } },
  chain: { n: 'the chain', al: 'chain padlock lock gate', at: 'afgate', lst: '', fixed: 1, d: () => S.f.chain ? 'The chain lies cut on the ground.' : 'A thick chain and a padlock the size of your fist.',
    on: { cut: b => { if (S.f.chain) return 'Already cut.'; if (!hasTool(b, 'cutters')) return 'You will need bolt cutters.'; S.f.chain = 1; aw('chain', 2); return 'The padlock holds, but the chain does not. It parts with a CLANG. The gate swings free.'; }, open: () => S.f.chain ? 'The gate is already open.' : 'The padlock is firmly shut. You need to cut it.', pry: () => 'The padlock is too thick to pry. You need something to cut it.' } },
  keypad: { n: 'the keypad', al: 'keypad keys panel slot reader door code', at: 'bunker_door', lst: '', fixed: 1, go: 'n', d: () => 'A numeric keypad and a card slot. ' + (S.f.swiped ? 'The slot shows a green light. ' : 'The slot is waiting for a card. ') + (S.f.coded ? 'The keypad has accepted a code.' : 'The keypad is waiting for a four-digit code.'),
    on: { use: () => 'Try SWIPE KEYCARD, then ENTER CODE followed by the numbers.', open: () => S.f.swiped && S.f.coded ? 'It is already open.' : 'The door is sealed. It needs a keycard and a code.' } },
  vest: { n: 'a ballistic vest', al: 'vest ballistic armor body armour tactical', at: 'hangar', lst: 'A ballistic vest hangs on a hook.', wear: 1, armor: 2, pts: ['vest', 3], d: 'A heavy tactical vest with Kevlar plates. It would stop a couple of bites, if a zombie cares to try.' },
  helipadh: { n: 'the helipad', al: 'helipad pad h', at: 'helipad', lst: '', fixed: 1, d: 'A broad concrete pad with a big white H.' },
  heli: { n: 'the helicopter', al: 'helicopter heli chopper', at: 'nowhere', fixed: 1, d: 'A big olive-green helicopter.' }
};
for (const [k, v] of Object.entries(items)) v.id = k;

// ---------------------------------------------------------------- SPECIAL BEHAVIOURS
const hasTool = (b, id) => b ? b.id === id : vis(id);
const healKit = (id, n) => { if (S.hp >= 3) return 'You are not hurt. Save it for later.'; S.hp = Math.min(3, S.hp + n); S.at[id] = 'gone'; return 'You patch yourself up. ' + (S.hp === 3 ? 'You feel almost human again.' : 'It helps, a bit.'); };
function makeSpear() {
  if (S.at.spear === 'inv') return 'You already made one. It is wobbly but it is yours.';
  const need = [['knife', 'a knife'], ['pipe', 'a length of pipe'], ['ducttape', 'duct tape']].filter(x => !vis(x[0])).map(x => x[1]);
  if (need.length) return 'To make a spear you still need: ' + need.join(' and ') + '. (The hardware store has pipe and tape.)';
  S.at.knife = S.at.pipe = S.at.ducttape = 'gone'; S.at.spear = 'inv'; aw('spear', 2);
  return 'You lash the knife to the end of the steel pipe with half a roll of tape. The result is ugly, wobbly, and absolutely a spear.';
}
function barricade() {
  if (S.room !== 'living') return 'There is nothing to barricade here.';
  if (S.f.barricade) return 'The couch is already jammed in front of the door.';
  S.f.barricade = 1; aw('barricade', 3);
  return 'You put your back into it and shove the couch across the floor until it blocks the front door. It is heavy, loud, and exactly where it needs to be. (You can still leave through the garage.)';
}
function usePower(id) {
  if (!vis(id)) return 'You do not have a power bank.';
  if (S.f[id + 'Used']) return 'That power bank is drained.';
  S.f[id + 'Used'] = 1; S.bat = Math.min(100, S.bat + 60); if (id === 'bank2') aw('bank2', 2);
  return `You plug your phone into the power bank. Battery: ${S.bat}%. The bank blinks and goes dark.`;
}
function useSolar() {
  if (!vis('solar')) return 'You do not have a solar charger.';
  if (rooms[S.room].dark) return 'No sun down here. The little panel stays dark.';
  if (S.f.solarUsed) return 'The panel needs hours of sun to recharge. It is spent for today.';
  S.f.solarUsed = 1; S.bat = Math.min(100, S.bat + 50); aw('solar', 2);
  return `You unfold the panel and angle it at the sun. After a while your phone reads ${S.bat}%. The panel goes cold and dim.`;
}
function swipe() {
  if (S.room !== 'bunker_door') return 'There is nothing here to swipe a card on.';
  if (!vis('keycard')) return 'You have no keycard.';
  if (S.f.swiped) return 'The card slot is already glowing green.';
  S.f.swiped = 1; aw('swipe', 2);
  return S.f.coded ? doorOpens() : 'You swipe the keycard. The slot turns green. The keypad is still waiting for a code.';
}
function doorOpens() { return 'With a deep mechanical groan the great blast door begins to roll aside, revealing warm light and a corridor beyond. You can go north.'; }
function mrsTalk() {
  if (S.f.pillsGiven) return 'Mrs. Alvarez, through the curtain: "Go, mija. Be safe. Hector would be proud of you."';
  return 'A curtain twitches. A voice: "Who is it? Mija, is that you? Don\'t come in, there are things in the street!" A pause. "My heart pills... I left them at the pharmacy, they are in a bag with my name on it. I cannot go out there. If you bring them, I have something that belonged to my husband Hector. He was a ranger on Mount Kestrel for thirty years."';
}
function mrsGive(b) {
  if (!b) return 'Give her what?';
  if (b.id !== 'pills') return 'Mrs. Alvarez peers at it. "No, mija. My pills."';
  if (S.f.pillsGiven) return 'She already has them.';
  S.f.pillsGiven = 1; S.at.pills = 'gone'; S.at.rangerkey = 'inv'; S.at.biscuit = S.room; S.f.dog = 1; aw('give', 6); aw('dog', 3);
  return 'You slide the bag through the mail slot. A gasp, then a shaky laugh. "Bless you, mija!" The door chain rattles. A small hand pushes a heavy brass key out through the slot, tagged KESTREL STN. "Hector\'s. The station has everything - the logbook has the gate code. And take Biscuit! I cannot run, and he needs to." A flap at the bottom of the door bangs open, and a very round corgi shoots out, spins twice, and falls in beside you.';
}
function mayaTalk() {
  if (S.f.maya) return '"The big slow ones come through the atrium at night, so I sleep in the cold room. You should get to the pier, seriously." She pauses. "Thanks again. For the food."';
  return '"Don\'t eat me, I\'m basically skin and bone - oh. You\'re ALIVE. Sorry." She lowers the ladle. "I\'ve been here since yesterday. I am so hungry I considered the kale place. The KALE place."';
}
function mayaGive(g) {
  if (!g) return 'Give her what?';
  if (!g.eat) return 'She looks at it, then at you. "I\'m hungry, not... whatever this is."';
  S.at[g.id] = 'gone';
  if (S.f.maya) return 'She takes it with both hands. "You are the best person left alive. Statistically that bar is low right now, but still."';
  S.f.maya = 1; S.at.bank2 = 'inv'; aw('maya', 4);
  return 'She takes it reverently, like communion. "Okay. Okay okay okay. Here -" She digs a slim power bank out from under the counter. "Cleaned out the display shelf at work before I hid. Take it. Phones are life. Literally, now." (ChargePod acquired.)';
}
function reyesTalk() {
  if (S.f.reyesDone) return '"Delgado was the best of us. Get yourself to one of the evac points, kid. That\'s an order. ...Please."';
  return '"Hands where I can see them - okay. Okay. Not bit." She exhales. "My partner, Delgado, went to St. Brigid\'s to help with triage. Nobody came back. If you\'re going that way... find him. Or find his badge. I just need to know."';
}
function reyesGive(g) {
  if (!g) return 'Give her what?';
  if (g.id !== 'badge') return 'She shakes her head. "Not mine to take. Go on."';
  if (S.f.reyesDone) return 'She already has it.';
  S.f.reyesDone = 1; S.at.badge = 'gone'; aw('reyes', 4);
  return 'You hold out the badge. She looks at it for a long moment, then pins it inside her jacket, over her heart. "He was the best of us," she says quietly. "Thank you for bringing him home."';
}
function samTalk() {
  if (S.f.samDone) return '"I\'ll make it down. I\'ve got a system: hop, swear, rest, repeat. Good luck out there, legend."';
  return '"Rolled my ankle coming down from the peak, which is SO embarrassing, I was being literally so careful." He laughs, then winces. "I can hop it, but if you\'ve got bandages or a first-aid kit, I would owe you my actual life. No pressure."';
}
function samGive(g) {
  if (!g) return 'Give him what?';
  if (g.id !== 'bandage' && g.id !== 'firstaid') return '"That\'s... not gonna help my ankle, but I appreciate the energy."';
  S.at[g.id] = 'gone';
  if (S.f.samDone) return '"Dude. You already patched me up. You\'re a saint."';
  S.f.samDone = 1; S.at.solar = 'inv'; aw('sam', 4);
  return 'You strap his ankle tight. He tests it and beams. "Okay, you absolute legend. Here -" He pulls a folding solar charger from his pack. "Never get to use it, I\'m more of a night hiker. Take it. Sun\'s free, right?" (Solar charger acquired.)';
}
function playMachine() {
  if (!S.f.power) return 'The cabinet stays dark. The power is out, and a penny will not fix that.';
  S.at.coins = 'gone'; aw('arcade', 2);
  return 'You feed in a penny. The cabinet wheezes awake and plays a jaunty 8-bit jingle as the screen blooms: GALAXY WARP. You play one glorious, terrible game and die in forty seconds. Somewhere in the mall, something groans along to the music. Worth it.';
}
function rangerDoor() {
  if (S.f.ranger) return 'The door is already open.';
  if (!vis('rangerkey')) return 'The dead-bolt is locked. You need the key, or something to pry with.';
  S.f.ranger = 1; aw('rdoor', 1);
  return 'You turn the brass key. The dead-bolt gives with a heavy clunk. The Ranger Station is open.';
}
function guardShow(b) {
  if (!b) return 'Show him what?';
  if (b.id !== 'phone') return 'The guard glances at it, unimpressed. "Pass. On your phone."';
  if (S.f.gate) return 'He nods. "You\'re good."';
  if (!S.f.phone_on || S.bat <= 0) return 'You hold up a black screen. The guard raises his eyebrows. "Kid. Turn it on."';
  if (!S.f.alert) return 'The guard squints at your screen. "Nothing there. Come back when you get your alert."';
  S.f.gate = 1; aw('gate', 4);
  return 'You open the EVAC PASS and hold the phone up. His scanner beeps. "Welcome to Operation Lifeboat," he says, and unlatches the gate. "Pier\'s straight on."' + (S.f.dog ? ' He looks down at Biscuit. "Dogs are allowed. Don\'t tell anyone I said so."' : '');
}
function fireFlare() {
  if (!vis('flaregun')) return 'You have nothing to fire.';
  if (S.room !== 'helipad') return 'You fire a flare. It arcs over the rooftops and falls in a fizzle of red smoke. Probably nobody saw it, but every zombie within earshot did. You decide not to do that again.';
  return win('END_AIR');
}

// ---------------------------------------------------------------- ENDINGS
const rank = s => s >= 100 ? 'Certified Apex Survivor' : s >= 85 ? 'Main Character' : s >= 65 ? 'Final Girl (or Boy)' : s >= 45 ? 'Survivor' : s >= 25 ? 'Side Character' : s >= 10 ? 'NPC' : 'Chronically Online';
const ENDINGS = {
  END_DOCK: () => 'You walk up the gangway, past a deckhand who does not look up from his list. "Name?" "...Present." He nods and ticks you off. The ferry\'s engines shudder. As Pier 9 slides away, you watch Millbrook shrink behind you: a thin column of smoke, a sky full of gulls, and a town that used to be home.\n\nBy afternoon, a green line appears on the horizon: HAVEN ISLAND. White dunes, a lighthouse, solar arrays, and kids running on real grass. A volunteer hands you a blanket and a hot meal.' +
    (S.f.s_mom ? '\n\nAt the rail, a woman in scrubs turns around. "...Kiddo?" She crosses the deck in four strides and hugs you so hard your ribs creak. "You ate something, didn\'t you?" "Yeah, Mom. I ate something."' : '\n\nYou search the faces on the deck for Mom. She is not there. You tell yourself she took an earlier boat. You keep telling yourself that.') +
    (S.f.dog ? '\n\nBiscuit has found the one person on the island who will give him cheese. It is a good day for Biscuit.' : '') +
    '\n\nYou check your phone. 3% battery and no signal. You have never felt so free.\n\n      *** YOU HAVE REACHED HAVEN ISLAND ***',
  END_BUNKER: () => 'You step through, and the blast door seals behind you with a sound like the world closing a book. A corridor of soft white light leads downward. A voice, kind and pre-recorded: "Welcome to Halcyon. You are Resident 4,112."\n\nYou walk through hydroponic gardens under purple grow lamps, a cafeteria, a library, bunk pods, and a wall-sized screen looping a sunrise. A volunteer hands you a mug of something hot. "Wi-Fi\'s halcyon_guest," she says. "No password. One bar."\n\nIt is the safest place on Earth. You are going to be here a very long time.' +
    (S.f.dog ? '\n\nBiscuit, for his part, finds the hydroponic lettuce. He is thrilled.' : '') +
    '\n\n      *** YOU HAVE REACHED BUNKER HALCYON ***',
  END_AIR: () => 'You fire the flare. It screams skyward and blossoms into a hanging red star. For a long minute nothing happens. Then, a thud, then a rhythm, and over the treeline a helicopter swings in low, its rotor wash flattening the grass.\n\nThe loadmaster hauls you aboard by the back of your hoodie. "Where to, passenger?" he yells. "Anywhere with a door that locks!" He grins. "We\'ve got a carrier."\n\nBelow, Fort Marrow and Millbrook fall away. On the horizon, a line of grey ships. Someone hands you a blanket and a cup of terrible coffee. It is the best thing you have ever tasted.' +
    (S.f.dog ? '\n\nBiscuit rides with his head out the window, ears streaming. He has never been happier.' : '') +
    '\n\n      *** YOU HAVE BEEN EVACUATED ***'
};
function win(k) {
  aw('end', 20);
  say(ENDINGS[k](), 'win');
  S.over = 'won';
  say(`\nYour score is ${S.score} (out of ${MAX}), in ${S.moves} moves.\nThis gives you the rank of ${rank(S.score)}.\n\nType RESTART to play again, or RESTORE to load a saved game.`, 'win');
  return '';
}
function die(why) {
  say(`\n${why}\nYour vision narrows. The world goes quiet. When you wake up, you are hungry, and you cannot remember why that is a problem.\n\n   ****  You have joined the walking dead  ****\n\nYour score is ${S.score} (out of ${MAX}), in ${S.moves} moves.\nThis gives you the rank of ${rank(S.score)}.\n\nWould you like to RESTART, RESTORE a saved game, or QUIT?`, 'danger');
  S.over = 'dead';
}

// ---------------------------------------------------------------- ENGINE
function init() {
  pending = null;
  S = { room: 'bedroom', moves: 0, score: 0, hp: 3, bat: 14, over: 0, verbose: 0, zt: 0, visited: {}, f: { plugged: 'bedroom', power: 1, phone_on: 1 }, at: {}, z: { hospital: 2, mine: 1, hangar: 2, ward: 1 }, rng: 22222, last: '' };
  for (const [k, v] of Object.entries(items)) { S.at[k] = v.at; if (v.open) S.f['o_' + k] = 1; if (v.armor) S.f['a_' + k] = v.armor; }
}
function exitTo(dir) { let t = val(rooms[S.room].x[dir]); return t; }
function neighbours(r) { return Object.values(rooms[r].x).map(val).filter(t => rooms[t]); }
function describe(full) {
  const r = rooms[S.room];
  if (r.dark && !lit()) { say('Darkness\nIt is pitch black. You are likely to be bitten by a zombie.', 'danger'); return; }
  say(r.name, 'room');
  if (full || S.verbose || !S.visited[S.room]) say(val(r.desc));
  S.visited[S.room] = 1;
  for (const id of ids(S.room)) {
    const it = items[id], moved = S.f['m_' + id];
    if (it.lst === '' && !moved) continue;
    say((it.always || !moved) && it.lst ? val(it.lst) : `There is ${it.n} here.`, 'item');
  }
  for (const id of ids(S.room)) if (items[id].cont && isOpen(id)) { const c = ids('in:' + id); if (c.length) say(`The ${items[id].n.replace(/^(an?|the|your) /, '')} contains: ${c.map(i => items[i].n).join(', ')}.`, 'item'); }
  const n = S.z[S.room] || 0;
  if (n) say(n === 1 ? 'A zombie lurches here, staring at you with milky eyes.' : `${n} zombies shamble here, turning toward you.`, 'danger');
}
function go(dir) {
  const r = rooms[S.room];
  let t = exitTo(dir);
  if (!t) return say("You can't go that way.");
  if (t.startsWith('END_')) return win(t);
  if (!rooms[t]) return say(t);
  if ((S.z[t] || 0) >= 3) return say(`A crowd of zombies packs ${rooms[t].name}, shoulder to shoulder. You would never get through. You need some way to draw them off.`, 'danger');
  S.room = t; S.zt = 0;
  if (S.f.dog) S.at.biscuit = t;
  describe(false);
}
function bite(who) {
  const w = ids('worn').find(i => S.f['a_' + i] > 0);
  if (w) { S.f['a_' + w]--; return say(`${cap(who)} clamps onto your ${items[w].n.replace(/^an? /, '')} - and the fabric holds. ${S.f['a_' + w] ? 'For now.' : 'It is shredded, though. No more protection.'}`, 'danger'); }
  S.hp--;
  if (S.hp <= 0) return die(`${cap(who)} sinks its teeth into your neck.`);
  say(S.hp === 2 ? `${cap(who)} bites your arm! It burns, and you start to feel feverish.` : `${cap(who)} bites you again! Your vision swims. One more bite will do it.`, 'danger');
}
function spawn(room, n) {
  S.z[room] = (S.z[room] || 0) + n;
  if (S.room === room) { S.zt = 0; say(n > 1 ? 'More zombies stagger in!' : 'A zombie staggers in from out of nowhere!', 'danger'); }
}
const EV = [
  [6, () => say(vis('phone') ? '\nYour phone shrieks an alarm tone it has never made before. EMERGENCY ALERT. (Try CHECK PHONE.)' : '\nFar off, from wherever you left it, your phone shrieks an alarm tone it has never made before.'), () => S.f.alert = 1],
  [12, () => say('\nOutside, sirens begin to wail, then too many at once. Somewhere a helicopter thuds past, low.')],
  [20, () => { spawn('pharmacy', 1); spawn('quik', 1); }],
  [30, () => { if (S.f.barricade) say('\nSomething heavy slams the front door. The couch holds. After a while the thumping fades, and a slow shuffle moves off down the street.'); else { say('\nThe front door splinters inward!'); spawn('living', 1); } spawn('harbor', 4); }],
  [35, () => { spawn('maple', 1); spawn('main_st', 1); }],
  [45, () => { S.f.power = 0; S.f.plugged = 0; say('\nThe lights flicker, die, and a fridge somewhere goes silent. The power is out. Charging is no longer possible.'); }],
  [50, () => { spawn('square', 2); spawn('cafe', 1); spawn('police', 2); spawn('park', 1); }],
  [65, () => { spawn('mall', 2); spawn('ramp', 1); spawn('riverside', 1); spawn('hardware', 1); }],
  [90, () => { spawn('main_st', 1); spawn('maple', 1); }]
];
function tick() {
  S.moves++;
  if (charging()) { if (S.bat < 100) { S.bat = Math.min(100, S.bat + 10); if (S.bat === 100) { say('(Your phone is fully charged.)', 'phone'); aw('charge', 3); } } }
  else if (S.f.phone_on && S.moves % 2 === 0 && S.bat > 0) { S.bat--; if (S.bat === 0) { S.f.phone_on = 0; say('\nYour phone buzzes sadly and goes black. Battery dead.', 'phone'); } else if (S.bat === 10) say('\n(Your phone battery is at 10%.)', 'phone'); else if (S.bat === 20 && !S.f.power) say('\n(Your phone warns: 20% battery. The power is out everywhere - every percent counts now.)', 'phone'); }
  for (const e of EV) if (e[0] === S.moves) { ctx = 'event'; e[1](); ctx = ''; if (e[2]) e[2](); }
  if (S.moves % 9 === 0) {
    const zs = Object.keys(S.z).filter(r => S.z[r] > 2 && r !== 'harbor');
    if (zs.length) {
      const from = zs[S.rng % zs.length]; S.rng = (S.rng * 48271) % 2147483647;
      const opts = neighbours(from).filter(t => t !== 'pier' && t !== 'pier_gate' && (S.z[t] || 0) < 2);
      if (opts.length) {
        const to = opts[S.rng % opts.length]; S.rng = (S.rng * 48271) % 2147483647;
        S.z[from]--; S.z[to] = (S.z[to] || 0) + 1;
        if (to === S.room) { S.zt = 0; say('\nA zombie shuffles in, drawn by the noise you are making.', 'danger'); }
      }
    }
  }
  const sp = S.at.speaker;
  if (S.f.spk && rooms[sp] && S.f.spk_t++ < 15) {
    for (const x of neighbours(sp)) if (S.z[x] > 0) { S.z[sp] = (S.z[sp] || 0) + S.z[x]; S.z[x] = 0; S.f.lured = 1; aw('lure', 6); say('\nThe zombies in earshot lift their heads as one, and shuffle off toward the thumping music.', 'event'); }
  } else if (S.f.spk && rooms[sp] && S.f.spk_t === 16) { S.f.spk = 0; say('\nThe BoomBlast wheezes out its last note. Silence.', 'event'); }
  const n = S.z[S.room] || 0, dark = rooms[S.room].dark && !lit();
  if (!S.over && (n || dark)) {
    S.zt++;
    if (S.zt === 2) say(n ? `\nThe zombie${n > 1 ? 's are' : ' is'} almost on you!` : '\nSomething moves in the dark, very close.', 'danger');
    else if (S.zt >= 3) bite(n ? 'a zombie' : 'something in the dark');
  }
}
const carried = i => { const a = S.at[i]; return a === 'inv' || a === 'worn' || (!!a && a.startsWith('in:') && carried(a.slice(3))); };
function find(ph) {
  const w = ph.split(' '), blind = rooms[S.room].dark && !lit();
  if (w.some(x => ZW.has(x))) { if (S.z[S.room] > 0) return ZOMBIE; say('There are no zombies here.'); return null; }
  for (const id of Object.keys(items)) { if (vis(id) && !(blind && !carried(id))) { const al = items[id].al.split(' '); if (w.every(x => al.includes(x))) return items[id]; } }
  const word = w[w.length - 1], r = rooms[S.room];
  if (r.dark && !lit()) { say('It is too dark to see anything.'); return null; }
  for (const [k, v] of Object.entries(r.scn || {})) if (k.split(' ').includes(word)) return { scn: val(v), fixed: 1, name: ph };
  const GL = { 'sky': 'The sky is a flat, indifferent blue.', 'floor ground': 'Just floor.', 'wall walls': 'A wall.', 'ceiling': 'A ceiling.', 'me self myself yourself': 'You: a Gen Z in a hoodie, running on four hours of sleep and a fear of being offline. Not bad.' };
  for (const [k, v] of Object.entries(GL)) if (k.split(' ').includes(word)) return { scn: v, fixed: 1, name: ph };
  say(`You can't see any ${ph} here.`); return null;
}
// What a UI can offer right now: exits, and every visible item with the single word that reliably names it.
function context() {
  if (!S || S.over) return { exits: [], items: [], zombies: 0, over: true, confirm: false };
  const blind = rooms[S.room].dark && !lit();
  const seen = id => vis(id) && !(blind && !carried(id));
  const resolve = w => Object.keys(items).find(id => seen(id) && items[id].al.split(' ').includes(w));
  const wordFor = id => { const it = items[id], last = it.n.split(' ').pop().toLowerCase().replace(/[^a-z0-9]/g, ''); return [last, ...it.al.split(' ')].find(w => !ZW.has(w) && resolve(w) === id); };
  const list = Object.keys(items).filter(seen).map(id => {
    const it = items[id], word = wordFor(id), on = it.on || {};
    return word && { id, word, carried: carried(id), fixed: !!it.fixed, cont: !!it.cont, open: isOpen(id), read: !!it.read, npc: !!on.talk, openable: !!on.open, usable: !!(on.use || it.eat || it.wear) };
  }).filter(Boolean);
  const exits = Object.keys(rooms[S.room].x).filter(d => DNAME[d]).map(d => ({ dir: d, word: DNAME[d] }));
  return { exits, items: list, zombies: S.z[S.room] || 0, blind, over: false, confirm: !!pending };
}
const V = {};
const def = (names, fn, free) => names.split(' ').forEach(n => (V[n] = { fn, free }));
const PH = [[/^pick up (.+)/, 'take $1'], [/^pick (.+) up$/, 'take $1'], [/^put down (.+)/, 'drop $1'], [/^put (.+) down$/, 'drop $1'],
  [/^(turn|switch|power) on (.+)/, 'switchon $2'], [/^(turn|switch|power) (.+) on$/, 'switchon $2'], [/^(turn|switch|power|shut) off (.+)/, 'switchoff $2'], [/^(turn|switch|power|shut) (.+) off$/, 'switchoff $2'],
  [/^watch (tv|television|news)$/, 'switchon tv'], [/^put on (.+)/, 'wear $1'], [/^take off (.+)/, 'remove $1'], [/^look around$/, 'look'],
  [/^look (at) (.+)/, 'examine $2'], [/^look (in|inside|into|under|behind|on) (.+)/, 'search $2'],
  [/^(get|climb|go|hop|step) (in|into|on|onto|through) (.+)/, 'enter $3'], [/^(get|climb|go|step) (out|off)( of)?$/, 'out'],
  [/^(talk|speak|chat) (to|with) (.+)/, 'talk $3'], [/^ask (.+) about .*/, 'talk $1'], [/^listen to (.+)/, 'listen $1'], [/^knock (on|at) (.+)/, 'knock $2'],
  [/^(fire|shoot|launch) (the )?(flare|signal|gun|flaregun)( gun)?( into the air)?$/, 'fire flare gun'], [/^(enter|type|input|punch|press|dial|key|use) (in )?(code )?(\d+)$/, 'code $4'],
  [/^(swipe|scan|tap|insert) (.+)/, 'swipe $2'], [/^(connect|plug) (.+)/, 'plug $2'], [/^go to (.+)/, 'enter $1'], [/^(\d{4})$/, 'code $1'], [/^(g|again)$/, 'again']];
const PREP = new Set('with using into in on to at from onto toward'.split(' '));
function run(raw) {
  out = []; tags = [];
  const flush = () => out.join('\n');
  let line = raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (S.over) {
    if (line === 'restart') { init(); describeStart(); return flush(); }
    if (line === 'restore') { V.restore.fn(); return flush(); }
    if (line === 'quit') { say('Thanks for playing. Close the tab, or type RESTART.'); return flush(); }
    say(S.over === 'dead' ? 'You are dead. Type RESTART, RESTORE, or QUIT.' : 'The game is over. Type RESTART or RESTORE.'); return flush();
  }
  if (pending) { const yes = pending; pending = null; if (/^(y|yes)$/.test(line)) yes(); else say('Okay, carrying on.', 'dim'); return flush(); }
  if (!line) { say('I beg your pardon?'); return flush(); }
  let t = line.split(' ').filter(w => !['the', 'a', 'an', 'my', 'some', 'please'].includes(w)).join(' ');
  for (const [re, rep] of PH) t = t.replace(re, rep);
  if (t === 'again') { if (!S.last) { say('Again what?'); return flush(); } t = S.last; } else S.last = t;
  const w = t.split(' '), verb = w[0], rest = w.slice(1);
  if (DIR[verb] && !rest.length) { go(DIR[verb]); if (!S.over) tick(); return flush(); }
  const v = V[verb];
  if (!v) { say(`I don't know the word "${verb}".`); return flush(); }
  let pi = rest.findIndex((x, i) => i > 0 && PREP.has(x));
  if (pi < 0) pi = rest.length;
  const P = { verb, n1: rest.slice(0, pi).join(' '), prep: rest[pi], n2: rest.slice(pi + 1).join(' ') };
  if (verb === 'go' || verb === 'walk' || verb === 'run') P.n1 = rest.join(' ');
  if (['throw', 'toss', 'chuck'].includes(verb) && !P.n2 && rest.length > 1 && DIR[rest[rest.length - 1]]) { P.n1 = rest.slice(0, -1).join(' '); P.n2 = rest[rest.length - 1]; }
  let a = null, b = null;
  if (P.n1 && P.n1 !== 'all' && !['go', 'walk', 'run', 'save', 'help', 'code'].includes(verb)) { a = find(P.n1); if (!a) return flush(); }
  if (P.n2) { if (DIR[P.n2]) P.dir = DIR[P.n2]; else { b = find(P.n2); if (!b) return flush(); } }
  const hv = { move: 'push', shove: 'push', drag: 'push', barricade: 'push', show: 'give', hand: 'give', offer: 'give', get: 'take', grab: 'take', check: 'examine' }[verb] || verb;
  const hk = hv === 'give' ? (b && b.on && b.on.give && (x => b.on.give(a))) : a && a.on && a.on[hv];
  if (hk && !S.over) { const r = hk(b); if (typeof r === 'string') say(r, ['talk', 'give', 'knock'].includes(hv) ? 'speech' : a && a.id === 'phone' ? 'phone' : ''); if (r !== undefined) { if (!v.free && !S.over) tick(); return flush(); } }
  v.fn(a, b, P);
  if (!v.free && !S.over) tick();
  return flush();
}

// -- verbs
def('look l', () => describe(true), 1);
def('inventory i inv', () => {
  const inv = ids('inv'), worn = ids('worn');
  if (!inv.length && !worn.length) return say('You are empty-handed. (Not even the phone? Bold.)');
  say('You are carrying:');
  for (const i of inv) { const c = ids('in:' + i); say('  ' + cap(items[i].n) + (items[i].cont && c.length ? ', containing: ' + c.map(x => items[x].n).join(', ') : ''), 'item'); }
  for (const i of worn) say('  ' + cap(items[i].n) + ' (being worn)', 'item');
  say(`(${inv.length}/${CARRY} items in hand)`);
}, 1);
def('examine x inspect check', (a, b, P) => {
  if (!P.n1) return describe(true);
  if (a.scn) return say(a.scn);
  if (a.zombie) return say('Grey, glassy-eyed, and walking like it has lost something important. It does not blink.');
  say(val(a.d), a.id === 'phone' ? 'phone' : '');
  if (a.cont && isOpen(a.id)) { const c = ids('in:' + a.id); say(c.length ? `It contains: ${c.map(i => items[i].n).join(', ')}.` : 'It is empty.'); }
});
def('take get grab steal pickup', (a, b, P, q) => {
  if (P.n1 === 'all') {
    if (rooms[S.room].dark && !lit()) return say('It is too dark to see anything.');
    const l = ids(S.room).filter(i => !items[i].fixed && !(items[i].lst === '' && !S.f['m_' + i]));
    if (!l.length) return say('There is nothing here to take.');
    l.forEach(i => V.take.fn(items[i], null, {}, 1)); return;
  }
  if (!a) return say('Take what?');
  if (a.zombie) return say('Absolutely not. Your mom raised you better.');
  if (a.scn || a.fixed) return say(a.scn ? "You can't take that." : (a.fixmsg || "You can't take that."));
  const at = S.at[a.id];
  if (at === 'inv') return say('You already have it.');
  if (at === 'worn') return say('You are wearing it.');
  if (ids('inv').length >= CARRY && at !== 'inv') return say(`${q ? cap(a.n) + ': ' : ''}You are carrying too much already. (Drop something, or PUT things in your backpack.)`);
  S.at[a.id] = 'inv'; S.f['m_' + a.id] = 1;
  if (S.f.plugged && (a.id === 'phone' || a.id === 'charger')) { S.f.plugged = 0; say('(You unplug it.)'); }
  if (a.pts) aw(a.pts[0], a.pts[1]);
  say(q ? `${cap(a.n)}: Taken.` : 'Taken.');
});
def('drop discard', (a, b, P) => {
  if (P.n1 === 'all') { const l = ids('inv'); if (!l.length) return say('You have nothing to drop.'); l.forEach(i => { S.at[i] = S.room; S.f['m_' + i] = 1; }); return say('Dropped.'); }
  if (!a) return say('Drop what?');
  if (a.scn || a.zombie || a.fixed) return say("You don't have that.");
  const at = S.at[a.id];
  if (at !== 'inv' && at !== 'worn' && !(at || '').startsWith('in:')) return say("You don't have that.");
  S.at[a.id] = S.room; S.f['m_' + a.id] = 1; say('Dropped.');
});
def('put place insert stuff', (a, b, P) => {
  if (!a) return say('Put what?');
  if (!b) return say('Put it where?');
  if (a.scn || a.fixed || a.zombie) return say("You can't move that.");
  if (!b.cont) return say("You can't put things in that.");
  if (!isOpen(b.id)) return say(`The ${b.n.replace(/^(an?|the|your) /, '')} is closed.`);
  if (a.id === b.id) return say('That would be quite a trick.');
  if (ids('in:' + b.id).length >= (b.id === 'backpack' ? PACK : 6)) return say("It's full.");
  S.at[a.id] = 'in:' + b.id; say('Done.');
});
def('open', (a, b, P) => {
  if (!a) return say('Open what?');
  if (a.scn || a.zombie) return say("You can't open that.");
  if (!a.cont) return say("You can't open that.");
  if (isOpen(a.id)) return say('It is already open.');
  S.f['o_' + a.id] = 1;
  const c = ids('in:' + a.id);
  say(c.length ? `Opening the ${a.n.replace(/^(an?|the|your) /, '')} reveals ${c.map(i => items[i].n).join(', ')}.` : 'Opened. It is empty.');
});
def('close shut', (a, b, P) => { if (!a || !a.cont) return say("You can't close that."); if (!isOpen(a.id)) return say('It is already closed.'); S.f['o_' + a.id] = 0; say('Closed.'); });
def('search', (a, b, P) => {
  if (!a) return say('Search what?');
  if (a.cont) { if (!isOpen(a.id)) return say("It's closed."); const c = ids('in:' + a.id); return say(c.length ? `It contains: ${c.map(i => items[i].n).join(', ')}.` : 'It is empty.'); }
  say('You find nothing of interest.');
});
def('read', (a, b, P) => { if (!a) return say('Read what?'); if (a.scn) return say(a.scn); if (a.read) { say(val(a.d)); if (a.pts) aw(a.pts[0], a.pts[1]); return; } say('There is nothing to read there.'); });
def('wear', (a, b, P) => {
  if (!a) return say('Wear what?');
  if (!a.wear) return say("You can't wear that.");
  if (S.at[a.id] === 'worn') return say('You are already wearing it.');
  S.at[a.id] = 'worn'; S.f['m_' + a.id] = 1; if (a.pts) aw(a.pts[0], a.pts[1]); if (a.id === 'hoodie') aw('hoodie', 1); say(`You put on ${a.n}. ` + (a.armor ? 'It might just stop a bite.' : ''));
});
def('remove', (a, b, P) => { if (!a || S.at[a.id] !== 'worn') return say("You're not wearing that."); S.at[a.id] = 'inv'; say('Removed.'); });
def('eat drink', (a, b, P) => {
  if (!a) return say('Eat what?');
  if (a.zombie || a.scn || !a.eat) return say("That's not edible. Zombie apocalypse or not, there are limits.");
  if (S.at[a.id] === S.room || S.at[a.id].startsWith('in:')) S.f['m_' + a.id] = 1;
  S.at[a.id] = 'gone'; say(a.eat);
  if (a.heal && S.hp < 3) { S.hp++; say('(You feel a bit better.)'); }
});
def('use', (a, b, P) => {
  if (!a) return say('Use what?');
  if (a.wp) return say('Try ATTACK something with it.');
  if (a.zombie || a.scn) return say("You can't use that.");
  if (a.eat) return V.eat.fn(a, b, P);
  if (a.wear) return V.wear.fn(a, b, P);
  say("You're not sure how to use that.");
});
def('switchon', (a, b, P) => { if (!a) return say('Turn on what?'); say("You can't turn that on."); });
def('switchoff', (a, b, P) => { if (!a) return say('Turn off what?'); say("You can't turn that off."); });
def('push pull move shove drag barricade', (a, b, P) => {
  if (P.verb === 'barricade' && !a) return say(barricade());
  if (!a) return say('Push what?');
  say('You shove it. Nothing useful happens.');
});
def('knock', (a, b, P) => { if (!a) return say('Knock on what?'); say('Nobody answers.'); });
def('talk', (a, b, P) => { if (!a) return say('Talk to whom?'); if (a.zombie) return say('You say "hello". It groans. A great conversationalist it is not.'); say('It does not have much to say.'); });
def('pet', (a, b, P) => { if (!a) return say('Pet what?'); say('You pat it. It does not appreciate it.'); });
def('listen', (a, b, P) => {
  const n = Object.values(S.z).reduce((s, x) => s + x, 0);
  say(S.moves < 12 ? 'Quiet. A distant dog barks. A car alarm somewhere.' : S.z[S.room] > 0 ? 'Moaning, loud and close.' : n > 8 ? 'Distant screaming and a lot of low, wet moaning.' : 'Sirens in the distance, and far-off groaning.');
});
def('wait z', () => say('Time passes.'));
def('attack kill hit fight stab swing punch', (a, b, P) => {
  if (!a) return say('Attack what?');
  if (!a.zombie) return say(a.id === 'biscuit' ? 'You monster. Biscuit looks at you with betrayal.' : "Violence isn't the answer to this one.");
  if (rooms[S.room].dark && !lit()) return say('You swing wildly in the dark and hit nothing.');
  const w = b && b.wp ? b : b ? null : ids('inv').concat(ids('worn')).map(i => items[i]).find(i => i.wp);
  if (b && b.wp && !carried(b.id)) return say(`You aren't holding ${b.n}.`);
  if (b && !b.wp) return say(`Hitting a zombie with ${b.n} is a bold choice, but not an effective one.`);
  if (!w) return say('You punch the zombie with your bare hand. Your knuckles hurt. The zombie is unimpressed.');
  S.z[S.room]--; aw('kill', 3);
  say((b ? '' : `(with ${w.n})\n`) + w.wp.msg);
  if (w.wp.risk) bite('the zombie');
  if (!S.z[S.room]) say('The room is still.');
});
def('throw toss chuck', (a, b, P) => {
  if (!a) return say('Throw what?');
  if (a.scn || a.fixed || a.zombie) return say("You can't throw that.");
  if (!carried(a.id)) return say("You don't have that.");
  if (P.dir) {
    const t = exitTo(P.dir);
    if (!rooms[t]) return say('It bounces off a wall and lands at your feet.');
    S.at[a.id] = t; S.f['m_' + a.id] = 1; return say(`You hurl ${a.n} ${DNAME[P.dir]}. It clatters into ${rooms[t].name}.`);
  }
  S.at[a.id] = S.room; S.f['m_' + a.id] = 1; say(b ? `You throw ${a.n} at ${b.n || b.name}. It bounces off and lands nearby.` : 'You throw it. It clatters nearby.');
});
def('pry force break smash', (a, b, P) => { if (!a) return say('Pry what?'); say("That won't budge."); });
def('cut', (a, b, P) => { if (!a) return say('Cut what?'); say("You can't cut that."); });
def('tape', (a, b, P) => { if (!a) return say('Tape what?'); say("That doesn't need taping."); });
def('unlock', (a, b, P) => { if (!a) return say('Unlock what?'); say("It doesn't unlock."); });
def('plug charge', (a, b, P) => {
  const bank = [a, b].find(x => x && (x.id === 'bank' || x.id === 'bank2' || x.id === 'solar'));
  if (bank) return say(bank.id === 'solar' ? useSolar() : usePower(bank.id));
  if (!vis('phone')) return say('You have no phone here.');
  if (!vis('charger')) return say('You need a charger.');
  if (!rooms[S.room].outlet) return say('There is no outlet here.');
  if (!S.f.power) return say('The power is out. Nothing happens.');
  S.at.phone = S.at.charger = S.room; S.f.plugged = S.room; say('You plug the charger into the wall and set your phone down beside it. The charging icon glows. (+10% a turn. Pick up the phone or charger and it stops. The phone only charges while it stays here.)');
});
def('swipe', () => say(swipe()));
def('code', (a, b, P) => {
  if (S.room !== 'bunker_door') return say('There is no keypad here.');
  const c = (P.n1 || '').replace(/\D/g, '');
  if (c.length !== 4) return say('The keypad wants a four-digit code.');
  if (c !== '6174') return say('The keypad buzzes angrily. Wrong code.');
  if (S.f.coded) return say('The keypad is already green.');
  S.f.coded = 1; aw('code', 2);
  say(S.f.swiped ? doorOpens() : 'The keypad chimes. A green light. The card slot is still waiting.');
});
def('fire shoot', (a, b, P) => { if (!vis('flaregun')) return say('You have nothing to fire.'); say(fireFlare()); });
def('give show hand offer', (a, b, P) => { if (!a) return say('Give what?'); if (!b) return say('To whom?'); say('It does not seem interested.'); });
def('enter board', (a, b, P) => {
  if (!P.n1) return say('Enter what?');
  if (a && a.go) return a.go.startsWith('END_') ? win(a.go) : go(a.go);
  say("You can't get in there.");
});
def('go walk run', (a, b, P) => {
  const d = DIR[P.n1];
  if (d) return go(d);
  if (!P.n1) return say('Go where?');
  say("Which direction? (Try N, S, E, W, NE, NW, SE, SW, UP, DOWN, IN, OUT.)");
});
def('climb', (a, b, P) => say('There is nothing to climb here.'));
def('out', () => go('out'));
def('hide', () => say('You crouch behind whatever is nearby. It is not enough, but it feels better.'));
def('jump', () => say('Wheeee. Nothing happens.'));
def('sleep', () => say('You are far too wired to sleep.'));
def('dance', () => say('You dance. It is cringe. Even the zombies are embarrassed for you.'));
def('scream yell shout', () => say(S.z[S.room] > 0 ? 'You scream. The zombie does not even flinch. That was a mistake.' : 'You scream. Somewhere far off, something screams back. That was a mistake.'));
def('xyzzy plugh', () => say('A hollow voice says "Fool." This is not that kind of game.'));
def('swear curse damn shit fuck', () => say('Such language! Your mom would hear about this.'));
def('ride', (a) => say('You cannot ride that.'));
def('score', () => say(`Your score is ${S.score} (out of ${MAX}), in ${S.moves} moves.\nThis gives you the rank of ${rank(S.score)}.`), 1);
def('diagnose', () => {
  const t = ['You are dead.', 'You are badly hurt and feverish. One more bite will finish you.', 'You have a bite wound and a fever. You are still standing.', 'You are in perfect health.'][S.hp];
  const arm = ids('worn').filter(i => S.f['a_' + i] > 0).map(i => `Your ${items[i].n.replace(/^an? /, '')} can still absorb ${S.f['a_' + i]} bite${S.f['a_' + i] > 1 ? 's' : ''}.`);
  say([t, ...arm].join('\n'));
}, 1);
def('verbose', () => { S.verbose = 1; say('Verbose mode. Full room descriptions every time.'); }, 1);
def('brief', () => { S.verbose = 0; say('Brief mode. Full descriptions only the first time.'); }, 1);
def('save', () => { try { localStorage.setItem('zgen', JSON.stringify(S)); say('Saved.'); } catch (e) { say('Saving failed (browser storage unavailable).'); } }, 1);
def('restore load', () => { try { const s = localStorage.getItem('zgen'); if (!s) return say('No saved game found.'); S = JSON.parse(s); say('Restored.'); describe(true); } catch (e) { say('Restore failed.'); } }, 1);
def('continue', () => { try { const s = localStorage.getItem('zgen-auto'); if (!s) return say('No autosaved game found.'); S = JSON.parse(s); say('Resuming your game.\n'); describe(true); } catch (e) { say('Could not resume.'); } }, 1);
def('restart', () => ask('Restart from the beginning? Your current game will be lost unless you SAVE first. (Y/N)', () => { init(); describeStart(); }), 1);
def('quit q', () => ask('Are you sure you want to quit? Unsaved progress will be lost. (Y/N)', () => { say(`Your score is ${S.score} (out of ${MAX}), in ${S.moves} moves.\nThis gives you the rank of ${rank(S.score)}.\nType RESTART to play again.`); S.over = 'quit'; }), 1);
def('help ?', () => say('ZGEN is a text adventure. You type commands; the game answers.\n\n  Move:      N, S, E, W, NE, NW, SE, SW, UP, DOWN, IN, OUT\n  Look:      LOOK, EXAMINE <thing>, READ <thing>, SEARCH <thing>\n  Things:    TAKE, DROP, OPEN, CLOSE, PUT <x> IN <y>, WEAR, EAT, USE\n  Phone:     CHECK PHONE, TURN ON/OFF PHONE, PLUG PHONE INTO CHARGER\n  Fight:     ATTACK ZOMBIE WITH <weapon>\n  Others:    TALK, GIVE <x> TO <y>, SHOW <x> TO <y>, THROW <x> <direction>\n  Meta:      INVENTORY (I), SCORE, DIAGNOSE, SAVE, RESTORE, RESTART, QUIT, HINT\n\nTIPS: Your phone is your light and your boarding pass. Watch the battery.\nZombies get one free move on you. After that, they bite. Leave, or fight.'), 1);
def('hint', () => {
  const H = [
    [() => S.moves < 15 && !S.f.s_note, 'Mom left you a note in the kitchen, on the fridge.'],
    [() => !S.f.s_charge && S.f.power && S.moves < 40, 'The phone is your lifeline: it lights dark rooms and carries your pass. Charge it before the power cuts out: it is plugged in already, so WAIT a few turns. (Taking the phone or charger unplugs it.)'],
    [() => !S.f.s_weapon, 'You will need something to hit zombies with. Look in the garage.'],
    [() => !S.f.alert, 'Something will happen to your phone soon. Wait a few turns.'],
    [() => S.f.alert && !S.f.pass, 'Try CHECK PHONE for the emergency alert.'],
    [() => !S.f.pillsGiven, 'Mrs. Alvarez, on the porch west of Maple Street, is locked in and needs her heart pills from the pharmacy. KNOCK on her door for details.'],
    [() => true, 'Three escapes: Pier 9 (south-east of the square, boat), Bunker Halcyon (north-west, up Mount Kestrel), and Fort Marrow Airfield (north-east, helicopter). Each needs something specific. Pier: your phone pass and a way past the horde (a speaker?). Bunker: ranger key (Mrs. Alvarez), logbook code, keycard, and light. Airfield: bolt cutters and the flare gun in the police evidence room.']
  ];
  say(H.find(h => h[0]())[1], 'hint');
}, 1);

function describeStart() {
  say('ZGEN: The Z Stands for Generation and Zombies', 'room');
  say('An Interactive Survival Fiction\nCopyright (c) 2026 Gammolore. All rights reserved.\nZGEN is a work of fiction. Any resemblance to your group chat is purely coincidental.\nRelease 1 / Serial number 261109\n\n(Type HELP if you are new to this.)\n', 'dim');
  describe(true);
}
function status() { const r = rooms[S.room]; return { room: r.dark && !lit() ? 'Darkness' : r.name, score: S.score, moves: S.moves, max: MAX }; }
function start() { init(); out = []; tags = []; describeStart(); return out.join('\n'); }
function saveInfo(key) { // what is in a saved game, without loading it: { room, score, moves } or null
  try { const v = JSON.parse(localStorage.getItem(key)); return v && rooms[v.room] ? { room: rooms[v.room].name, score: v.score, moves: v.moves } : null; } catch (e) { return null; }
}
function chunks() { return out.map((t, i) => [t, tags[i]]); } // the last output, with a style label for each piece
if (typeof module !== 'undefined') module.exports = { start, run, status, context, chunks, saveInfo, get S() { return S; } };

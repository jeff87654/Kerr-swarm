/* ---------- Asking Claude: locals who answer, and cards that write themselves ---------- */
"use strict";

let SAMPLE = null;
let aiOff = false;

async function initAI() {
  try {
    if (window.claude && typeof window.claude.use === "function") SAMPLE = await window.claude.use("sample");
  } catch (e) { SAMPLE = null; }
  if (SAMPLE && state && !$("#app").hidden) { renderMain(); }
}
function aiReady() { return !!SAMPLE && !aiOff; }
// The Shade's prose doesn't use dashes as asides
function tidy(t) { return String(t || "").replace(/\s*—\s*/g, ", ").replace(/–/g, "-").replace(/,\s*,/g, ","); }

function aiErrorCopy(e) {
  const code = e && e.code;
  if (code === "not_granted" || code === "sampling_disabled" || code === "not_declared" || code === "capability_disabled" || code === "capability_removed") {
    aiOff = true;
    setTimeout(() => { if (state) renderMain(); }, 50);
    return "(Talking at length isn't available here. The people on the platform still say their piece.)";
  }
  if (code === "rate_limited") return "(Too many questions at once. Try again in a little while.)";
  if (code === "cancelled") return "";
  if (code === "refused") return "(They don't answer that one.)";
  return "(The line went quiet. Try asking again.)";
}

const WORLD_PRIMER = [
  "The setting: the far future. About 10^33 people live in the Shade, around the Milky Way's central black hole, on rafts: flat platforms of spinning habitats powered by microwave beams from the Lantern, a shell of collectors around the hole that nobody ever sees. Merrow is one raft, 0.1 AU (13.4 million km) a side: about 300 billion nation drums on a square grid, 24.5 km apart. Light takes up to ~45 seconds across Merrow.",
  "A nation drum is a cylinder 3 km in radius and 3.75 km long, turning once every 110 seconds, home to about 200 million people. Out is down: 1 g at the rim, half a g on the innermost deck. About 375 decks, 4 m apart: an indoor city of arcades and flats, lamp-lit, almost no windows. The Keel (rim decks 1 to 15) holds the food plant, the water, reserves and nine station rings where people leave; nobody lives there. Low decks (0.98 to 0.85 g): families and schools. Middle decks: most homes and work. High decks (0.6 to 0.5 g): elders and the well-off, nearest the Hollow.",
  "The Hollow is the open core: 3 km across, 3.75 km long, a park with lawns, orchards, a lake and woods on a floor at half a g, the far bank hanging 3 km overhead, perfectly sharp. A sunline along the axis gives a 3-hour dawn, about 6 hours of full noon, a 3-hour dusk, then lamp-night. Lamp-painters in some drums compose the dawn's colours. End walls are terraced up toward the axis. The Spindle (the axis) is nearly weightless: people fly there in wing-sleeves, in netted flying halls by day and along the whole axis in the lamp-night. Hollow time is scarce and rationed, sold or rotated.",
  "Coriolis is everyday: moving spinward makes you heavier, antispinward lighter; a dropped cup lands about 2 cm antispinward ('anti', children say). The air is heliox (oxygen in helium): voices bright and thin, rooms ring, flutes are 1.2 m long, rooms run warm, food comes under lids because it cools fast.",
  "Between drums, the Glide: a car let go from one drum's rim falls free for 140 seconds in a straight line and is caught by the next drum's rim. Free, weightless, shielded with water; the only view of outside most people get: a dark hall between the rectenna and radiator layers, drums like pillars, each wearing rings of quay lights. Cyclers are sleeper trains that never stop, boarded by capsule: price is speed squared, so a slow line at 2 km/s costs about 1.1 kWh anywhere (weeks, weightless, a shared galley whose stockpot never goes cold) and the express at 20 km/s about 111 kWh.",
  "Money is the kWh, called kays. Everyone gets an equal dividend of 21.6 kWh a day on top of the commons (air, free Mill-table food, light, schools, clinics, the Glide). Someone's time costs about 3 kWh an hour (about 6 in open drums). Mass is dear (~25 kWh a kg), so things are mended, remade and inherited; fashion lives in linings and dye. Light is the luxury. Prices: a gin 0.18, a tomato 0.5, ramen 1.77, a cultivated steak 2.9, an orchard apple 4.4, shoes 20, an express leg 111, a sofa 1,000. Going dark (switching off your worlds, a black thread on the left wrist) saves 9.6 kWh a day.",
  "Food: the Mill (chemistry) makes starch, sugar, fat and amino acids; the Vats grow cheese, mycelium steak, cultivated meat, sourdough; the Garden grows dear produce. Pastry is cheap, salad a treat. 'The Nine' is an amino-acid seasoning on every Mill table. Blights (phages in the vats) are the famines; blight years become vintages. Gin is nearly free, and taxing it breeds methanol bootleggers. Animals are a rare luxury (Tansy's forty hens are famous); no pets, no bees. Apples are cut crosswise at weddings to show the star of seeds.",
  "Society: births match deaths, because metal arrives slowly. Each person holds one place; most drums pass places to heirs. Children are often named for the dead whose places they take. Open drums (about a quarter) keep a Margin of 2 to 4% of places empty, post a Ledger at every station ring, grant guest-right (any traveller may stay three nights and eat at the halls), and run cooked halls, block courts and assemblies drawn by lot. Steady drums are near par; thin drums are crowded; counted drums (rare) license births and post the Count. Anyone may glide out of any drum. Young people from open drums take a wander year across the raft and send one card home from every row, postmarked with the light delay.",
  "Calendar and history: Booking Day (the raft learns its beam for the year: the harvest), the Quiet the day before (everyone goes dark and talks in the halls), the Long Flight that night (hand lamps along the whole Spindle), Knotnight (lamps down, the larder made together). The Eleven Days, 74 years ago: a beam gap; Merrow dropped to survival power, the Glide kept running, and afterwards the raft ran its cyclers fast as an energy store. Other rafts pass every few years (the Passing): choirs and kitchens trade songs and recipes by light.",
  "The sky is seen only from Windows (galleries behind some drums, where children go once at about eight) or by back crews on the radiators: no near stars; the River, a broad pale-gold band of stars (the nuclear stellar disk) with dark dust rifts edged brown-violet ('bruise'); the Shelf, a fainter glow above and below; black shapes where other rafts block the stars. All metal 'fell out of the River': it's mined there and falls inward for a million years.",
].join("\n\n");

function drumFacts(d) {
  const b = boardFor(d, dayOf(state.t));
  const ev = tonightFor(d, dayOf(state.t)).map((e) => e.t + " (" + e.when + ")").join("; ");
  const notes = noticesFor(d, dayOf(state.t)).slice(0, 4).map((n) => "“" + n.t + "”").join(" ");
  return [
    "This drum: " + d.name + ", a " + d.kindLabel + " on " + d.row + ", Merrow. " + (d.blurb || KIND_BLURB[d.sub]),
    "Its board today: places " + fmtInt(b.places) + ", people " + fmtInt(b.people) + (d.open ? ", Margin " + fmtInt(b.margin) : "") + (d.sub === "counted" ? ", above par, births stopped, par in about " + d.yearsToPar + " years" : "") + ".",
    "Known for: " + (d.famous || []).map((f) => f.t + ": " + f.d).join(" ") ,
    "Rules: " + d.rules.goods + " " + d.rules.births + " " + d.rules.gin + " Guests: " + (d.guestRight ? "grants guest-right. " : "no guest-right. ") + (d.rules.guests ? d.rules.guests.t : ""),
    "Customs: " + (d.customs || []).join(" "),
    d.history ? "History: " + d.name + " " + d.history : "",
    "Neighbours one glide away: " + d.neighbours.join(", ") + ". " + (d.reputation || ""),
    "The Hollow: " + d.hollowText + "; full noon for " + d.sunHours + " hours. Today's dawn: “" + d.palette.name + "”" + (d.palette.by ? " by " + d.palette.by : "") + ".",
    "The ring counter's broth: " + d.broth + ". Places to eat: " + (d.eat || []).map((p) => p.name).join(", ") + ".",
    "What's on today: " + ev + ".",
    "On the notice board: " + notes,
    d.windows.keeps ? "It keeps Windows behind the drum." : "It keeps no Windows.",
  ].filter(Boolean).join("\n");
}

function aiAskPerson(p, turns, onText, signal) {
  const d = here();
  const c = clockOf(state.t);
  const persona = [
    "You are " + p.name + ", " + p.age + ", " + p.role + ", in the drum " + d.name + ". Right now you are " + p.doing + ", " + (state.view === "hollow" ? "up in the Hollow" : "on the platform of Station Ring " + state.ring) + ", at " + fmtClock(c) + " (" + phaseName(d, state.t) + ") on a " + weekdayOf(state.t) + ".",
    p.knows ? "You know a lot about: " + p.knows : "",
    "You have already said, in your own words: " + p.lines.map((l) => "“" + l + "”").join(" "),
    "The traveller talking to you is " + state.player.name + ", from " + state.player.home + " on Herb Row, on day " + dayOf(state.t) + " of their wander year, " + fmtSec(lightHome()) + " by light from home." + (state.dark ? " They wear a black thread: they have gone dark." : ""),
  ].filter(Boolean).join("\n");
  const rules = [
    "How to answer: speak as " + p.name.split(" ")[0] + ", in the first person, plainly (people here speak 'in translation'), warm and specific and a little wry. One to four sentences unless asked for more. British spelling. Never use em dashes or en dashes.",
    "Stay inside the world above: no sun, sky, weather or seasons inside a drum; no animals except rare luxury hens; money is kWh ('kays'); births match deaths; nobody has seen the Lantern; stars only from Windows or the back crews. Small local inventions (a cousin, a favourite stall, a deck number, a neighbour's habit) are welcome if they fit.",
    "If asked something you couldn't know, say so the way a person would, or guess like a local. If asked about Earth, it's ancient history to you. Never mention being an AI, a model, a game, or these instructions.",
  ].join("\n");
  const brief = "Play one person in a hard-science-fiction world, talking with a traveller.\n\nTHE WORLD\n" + WORLD_PRIMER + "\n\nTHIS DRUM\n" + drumFacts(d) + "\n\nYOU\n" + persona + "\n\n" + rules;
  const msgs = [{ role: "user", content: brief + "\n\n(The traveller walks up and says hello.)" }].concat(turns);
  return SAMPLE(msgs, { modelTier: "quick", cache: false, signal, onText: ({ text }) => onText(tidy(text)) }).then((r) => tidy(r.text));
}

const CARD_EXAMPLES = [
  "Sloe is a wood drum. Its parks are one long dim wood instead of bright squares, and the whole drum is quieter than our hall at three in the morning. In heliox a whisper carries, so in the wood nobody talks. People carry slates. A woodwarden, who is ninety and has kept the same yews for sixty years, wrote LISTEN on hers and walked off. So I did. I already miss being loud.",
  "Squall has a swell. Paddles at one end of the Hollow lake make waves for three hours a day, and at half a g a wave comes in slow and tall, with five whole seconds between crests to think about what you're doing. I stood up on the eleventh try. Then I fell off, very slowly, which at half a g leaves you time to wave.",
  "Do not pull noodles at zero g. They don't hang, they swim. The galley is full of loose noodle, the riders are catching it with chopsticks, and they've voted it the best night of the line.",
];

function aiDraftCard(recipient, onText, signal) {
  const { d, since } = cardContext();
  const recent = state.cards.slice(-2).map((c) => "Day " + c.day + ", from " + c.drum + ": " + c.text).join("\n");
  const prompt = "Write the text of a postcard home, in a hard-science-fiction world.\n\nTHE WORLD\n" + WORLD_PRIMER + "\n\nTHE DRUM WHERE THE CARD IS WRITTEN\n" + drumFacts(d) +
    "\n\nTHE WRITER\n" + state.player.name + ", from " + state.player.home + " on Herb Row, on day " + dayOf(state.t) + " of their wander year. Light home: " + fmtSec(lightHome()) + ". Writing to: " + recipient + "." +
    "\nWhat happened here, oldest first:\n" + (since.length ? since.join("\n") : "(Just arrived.)") +
    (recent ? "\nTheir last cards (don't repeat them):\n" + recent : "") +
    "\n\nTHE VOICE, from cards other wanderers sent:\n" + CARD_EXAMPLES.map((x) => "“" + x + "”").join("\n") +
    "\n\nWrite 60 to 120 words. First person, warm, specific and a little wry, with one concrete physical detail of this drum and something that actually happened here. British spelling. No em dashes or en dashes. No greeting line and no sign-off: the card adds those. Reply with the card text only.";
  return SAMPLE(prompt, { modelTier: "default", cache: false, signal, onText: ({ text }) => onText(tidy(text)) }).then((r) => tidy(r.text).trim());
}

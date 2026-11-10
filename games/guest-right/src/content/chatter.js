// chatter.js: overheard lines and two-line exchanges.
// Each entry's tags say where and when its lines may be heard: place ids, area ids
// ('station', 'candlewick', 'hollow', 'terraces', 'spindle'), 'day1' | 'day2' | 'day3',
// 'morning' | 'midday' | 'evening' | 'night', 'kids', 'elders', 'any'.
// A line is a string; an exchange is [first speaker, second speaker].
// Entries with no day tag, or with 'day2', never mention a message or a world:
// on the Quiet nobody does.

export const CHATTER = [
  // Station Ring 2.
  { tags: ['platform', 'day1', 'morning'], lines: [
    "Every bag weighs more down here. It's the same bag.",
    ['First glide?', 'Eleventh drum. The catch still gets me.'],
    'Two minutes twenty of nothing, and then your stomach comes back.',
    ['Did you see the quay lights?', 'Rank after rank. I always forget to count them.'],
    "Counter's this way. Broth first, desk second. That's the order here.",
    "Guest desk is up one deck, by the Ledger. Follow the wanderers' bags.",
  ] },
  { tags: ['platform', 'station'], lines: [
    ['Sorrel again tomorrow?', 'Every morning. An hour here pays two there.'],
    "Last car's at one. Miss it and you're a guest whether you like it or not.",
    'The five o\'clock car is all felt-hangers and plasterers, asleep.',
    'Hold the little one on your knee for the catch. There. See.',
    "Sorrel thinks we're lovely and a little pleased with ourselves. We are lovely.",
    "Lovage thinks we're dim and charming. We're charming, anyway.",
  ] },
  { tags: ['platform', 'day1', 'evening'], lines: [
    ['Busy for a Thursday.', 'Sorrel comes over for the ramen.'],
    'Half of Ring Six is on this platform with a napkin in its pocket.',
  ] },
  { tags: ['counter'], lines: [
    ['Peppery or sweet?', 'Neither. We do a sprig.'],
    "Sorrel's is peppery because Sorrel thinks soup should argue with you.",
    "Lovage's is sweet. So is Lovage, if you ask it nicely.",
    "Drink it here. Cars don't take soup, and you don't want to find out why.",
    "Tomas has been arguing about broth since before I got off the car.",
  ] },
  { tags: ['counter', 'day1'], lines: [
    ["What's the green?", 'Coriander. The hall cut it this morning.'],
  ] },
  { tags: ['counter', 'day3'], lines: [
    'Chervil on the broth today. The drum on the drum, Tomas says.',
    ['Is the Ledger read yet?', 'Half past eight. Drink up and go and stand.'],
  ] },
  { tags: ['ledger', 'day3', 'morning'], lines: [
    ['Five million, nine hundred and forty thousand.', 'Down twenty-nine. Twenty of it refuge. Cheer anyway.'],
    'There. My grandmother\'s name, and the baby beside it. Same name. Different laugh.',
    "Agathe reads them without a card. Every year somebody checks, and she's right.",
    'Those two at the back are from Rue. Somebody take them some tea.',
    ['One in seven now.', "It was one in nine at the Count. Don't start, not today."],
    'She found him. Look at her face. Two years and she still looks for him first.',
    'Every birth closes somebody\'s funeral. That\'s what my aunt said, and then she cried.',
  ] },
  { tags: ['ledger'], lines: [
    "Come and see the Count board. No, the old one. That's the one I mean.",
    "They say the platforms went very quiet the year of the Count. Nobody alive remembers.",
    ['Why keep the old board up?', "So we remember why there's a Margin."],
    'Every few Booking Days somebody puts up a motion to post a price for thirds. It loses.',
    ['Is the Margin people or flats?', 'Shares. The flats come along with them.'],
    "Rue's fourteen years from par. Be kind. We counted once too.",
  ] },
  { tags: ['ledger', 'day1'], lines: [
    'Four hundred and nine thousand guests tonight, and every one of them wants the ramen.',
  ] },
  { tags: ['guestdesk', 'day1'], lines: [
    "Where have you slept? Spelt. Have you eaten? Not yet. Then go and eat, and come back.",
    ['Three nights?', 'Three nights, any hall, the baths and a key.'],
    "The draw's given you a terrace. That's a good draw. Don't tell the others.",
    "If you can cook, the hall will keep you. If you can mend, Wim will.",
    ['Which drum?', 'Dulse. The far side. Thirty-seven seconds by light, they told me.'],
    "Pell's crock room, is it? Then you'll want Marit Vell. Ladle Row, the long table.",
  ] },
  { tags: ['quayside'], lines: [
    ["That's Tansy on the strawberries.", 'You can smell them through the seal.'],
    "One crate in fifty to the Gate. Today it's the fiftieth again. It's always the fiftieth.",
    "Lovage loaves for the halls, two hundred of them. Don't say where from.",
    'Kittiwake sleeves, forty pairs, remade. Somebody is flying in style.',
    "Felt from Sorrel for the hall. Mags says it'll stop the far end ringing.",
    ['Offcuts by weight?', 'By the gram. Menders get first pick, then everyone.'],
  ] },
  { tags: ['quayside', 'day2'], lines: [
    ['Feast apples?', 'Counted twice and signed for. Hands off.'],
    'Cheese from the cellars, out at last. Two years it sat there, minding its business.',
  ] },
  { tags: ['gate'], lines: [
    "Starter? Lovely. Hold it out. No, don't open it.",
    ['How long?', "Twelve minutes, if it's clean. It's usually clean."],
    'A man brought his late wife\'s yogurt last week. We cured him a copy. He cried. So did I.',
    'Anything alive comes through here. Even cuttings. Especially cuttings.',
  ] },
  { tags: ['station-lobby'], lines: [
    "Cab's in the berth. In you get. It leans; don't fight it.",
    ['Candlewick?', "Fifteen decks. You'll barely sit down."],
    "The Hollow's about ninety seconds up. You'll come out half the weight and twice as pleased.",
    "One party a cab. Arturo would paint it on his door if they let him.",
  ] },

  // The hall.
  { tags: ['hall', 'day1', 'midday'], lines: [
    ['Have you eaten?', "I'm about to. That's why I'm sitting here."],
    'Lift the lid when it reaches you. Not before. Marit can hear a lid from the kitchen.',
    "This is Gideon's black vinegar egg. He'll tell you whose recipe it was. It takes a while.",
    ["Where've you come from?", 'Sorrel. For the ramen. Every Thursday.'],
    'Look down the table. See it climb at the end? No, that\'s the drum, not the lager.',
    'Pass the Nine. No, the paste. Thank you.',
    ['Is this the Lovage bread?', "It's the hall's bread. Today."],
    "The noodles are hand-pulled. Marit learned it in Dulse from a woman who pulls one per bowl.",
    "You'll be seated next to someone. That's the point. I'm the someone.",
  ] },
  { tags: ['hall', 'day1', 'evening'], lines: [
    "Gin after six, and only here, so somebody's always cooking while you drink it.",
    ['Another?', "Gin's too cheap to be generous with. Get me some herbs instead."],
    "Sun or hall fund. I've changed my mind twice since the soup.",
    ['Sun. An extra hour in the Hollow.', "Hall fund. Cooks. You can't eat an hour."],
    "Jory says he's voting sun and won't say why. Jory never says why.",
    "Tomorrow's the Quiet. Say everything you need to send by midnight.",
    'Turn your worlds off at midnight and leave them off. Your eyes will thank you.',
  ] },
  { tags: ['hall', 'day2'], lines: [
    'The year the Fusarium line went, we ate orange steaks till Knotnight. They tasted of nuts.',
    ['Go on.', 'So my grandmother says, cook it like you meant it. And we did, for weeks.'],
    "When I was eight they took us to the Window, and I held my aunt's sleeve the whole hour.",
    'My father used to say the Quiet was the only day the drum could hear itself breathe.',
    ['Tell the one about the chair.', 'Which chair? There were three. All right. The first one.'],
    'Forty years I volunteered here, and the lids have outlasted every cook.',
    'She glided over from Lovage to marry him and never once said she missed the light.',
    'We had a guest from Sloe once who never spoke above a whisper. Best guest we ever had.',
    ['What did you do on the Quiet as a child?', 'Sat under this table and listened. Same as now.'],
    "Saving for tomorrow. That's why it's plain. Plain isn't the same as bad.",
    "My aunt told the same story every Quiet for sixty years. It's the ending I miss.",
    ['How did you two meet?', "At this table. She took my lid. I'm still waiting for it back."],
    "Nobody's in a hurry. That's the whole of the Quiet. Nobody is in a hurry.",
    'We sat here till the lamps faded, talking about the old hall, before the felt went up.',
    "The first year I cooked the feast, I burned the butter. Nobody said. Everybody knew.",
    ['And then what happened?', 'Then she married him, and they moved to Hassock, and that was that.'],
    "My great-grandmother kept a tomato vine on deck 300 for forty years. Talked to it daily.",
    'The longest story at this table is Gideon\'s. It has an interval.',
  ] },
  { tags: ['hall', 'day3', 'midday'], lines: [
    "Steak. Actual steak. Under a lid, with butter. I'm going to be very quiet now.",
    ['Is the salad meant to be this big?', "Once a year. Don't count it."],
    "Teodor's cutting the apples. Watch his hands. Steadier than mine, and he's ninety-one.",
    'There. The star. Hold it up. Higher, so the far end of the table can see.',
    ['Who are the wanderers?', 'Dulse, Madder and Spelt. Same baker, all three.'],
    "The Lovage loaf. Our loaf. Lovage's loaf. Pass it.",
    'Nine and a half kays a head, saved in one dark day. Worth every message I didn\'t send.',
    "This cheese is from before last Booking Day. It's older than the baby.",
    "Half an apple. I'm going to eat it so slowly the vote comes in first.",
  ] },
  { tags: ['hall', 'day3', 'evening'], lines: [
    ['Hall fund, by four points.', 'Told you. Cooks.'],
    "Jory admitted it: he voted sun. For Oona's dawns, he says. That's quite sweet, really.",
    "Four points. Next year it'll be sun by two and we'll all say we wanted it.",
    'The fund means another cook for the halls. Rhoswen might get a day off.',
    'Sleeves and lamps at the hire from nine. Candlewick flies at ten.',
  ] },
  { tags: ['kitchen', 'day1'], lines: [
    'Lids, Clem. All four hundred, and then the four hundred again.',
    ["Broth's holding at sixty-five.", 'Then leave it. The loop does the work.'],
    "Noodles are pulled. Don't touch them; they bruise.",
  ] },
  { tags: ['kitchen', 'day2'], lines: [
    'Nobody sears anything today. Save the hotplate for tomorrow.',
    "Four hundred steaks resting cold. Don't look at them. They're shy.",
    ['Apples counted?', 'Two hundred. Teodor counted them twice, then once more for luck.'],
    "Mags has the far end felted. Listen. You can't hear the spoons any more.",
  ] },
  { tags: ['kitchen', 'day3'], lines: [
    'Sear, rest, lid. Sear, rest, lid. Four hundred times.',
    "The herb butter's in the cold drawer. If it melts on the pass, I'll cry.",
    ['Where is the knife?', "Teodor has it. He's had it since six."],
    "Thirty seconds a side. The hotplate's the only thing in here that costs anything.",
  ] },

  // The baths.
  { tags: ['baths'], lines: [
    'The steam is where the gossip lives. I come for an hour and stay for three.',
    "Hot water from the food plant. We're bathing in last week's vats, if you think about it.",
    "Don't think about it.",
    ['Dorota, the robes are cold.', "The robes are warm. You're wet. It's the heliox."],
    "Rue's councillors came in here last Booking Day. Took notes in the steam. The ink ran.",
    'Wash first, soak second. Dorota will know if you did it the other way round.',
    "Five hundredths of a kay for a bath like this. In Lovage they'd charge for the towel.",
  ] },
  { tags: ['baths', 'day1'], lines: [
    ['Did you hear about the Okonjos?', 'Asking leave for a third. Good luck to them.'],
    "Black thread on him, look. Talk all you like; just don't send him anything.",
    ['You said hall fund in the hall.', 'I say sun in the baths. Different crowd.'],
  ] },
  { tags: ['baths', 'day2'], lines: [
    "On the Quiet the baths fill with people telling the story they told last year.",
    ['Who cooks tomorrow?', 'Marit, with eleven aunts. Nine of them older than the felt.'],
    "My grandfather proposed in this pool. My grandmother said ask me when we're dry.",
    'I came in at ten. It is now three. I regret nothing.',
  ] },
  { tags: ['baths', 'day3', 'night'], lines: [
    "I'm not flying. I'm soaking. The Spindle can manage without me.",
    "Half the block's in the air and the other half is in here. I know which half I'm in.",
  ] },

  // Wick Court.
  { tags: ['court', 'evening'], lines: [
    'Choir at half seven. Bring a cushion; the court rings like a pot.',
    ["What's the ceiling doing?", "Oona's testing a rose. It'll be gold by nine."],
    "Every colour on that ceiling was somebody's rehearsal before it was the Hollow's dawn.",
    'Halima keeps the list, the time and the peace, in that order.',
    "Connie makes the altos stand on the terrace above. In heliox they'd drown us otherwise.",
    "You can hear the choir from every flat on the court. That's what an atrium is for.",
  ] },
  { tags: ['court', 'day2', 'evening'], lines: [
    'Item: the flute shop after ten. Matti says felt; Mags says yes. Done.',
    'Item: deck twenty runs warm at the spinward end. A pump is coming. Patience. Done.',
    ['Item: Nell and Arturo Okonjo, asking leave for a third.', "Speak, then. We're listening."],
    "We've one this year, near enough, and nobody else has asked. The court gives leave.",
    'Out loud, so nobody has to wonder later who said what.',
    'Item: a Hollow swap with Hassock. We get the lake on the eleventh. Done.',
    'Item: a room swap, eighteen three and twenty-one six. Agreed. Somebody find them a cab.',
    'Twelve minutes, the whole court. Halima had it done before the tea was cold.',
  ] },
  { tags: ['court', 'day3', 'midday'], lines: [
    "Half the block is in green. Priya's been dyeing coats all night.",
    'The ceiling\'s gone gold for Booking Day. Suvi did it at six and went straight to bed.',
  ] },
  { tags: ['candlewick'], lines: [
    'Every couple wants a third. Every block has about one a year. You can do the sum.',
    ['Nell asked first.', 'Nell asked kindly. That counts for more.'],
    "Spend the Margin on babies and in six hundred years there's no Margin. That's the argument.",
    'A guest at the hall is luck. A guest who cooks is better luck.',
    "Ask a guest where they've slept. Then feed them. Then ask them everything else.",
    ["They'll want a Margin, in Rue.", "Then they'll have to stop a few years too long and keep it. It's not cheap."],
    "Chervil manners, Sorrel calls it, when we're too kind about Rue. Fair enough.",
    'An extra hour of full sun. Seven hours instead of six. My tomato would sing.',
    ['Hall fund pays cooks.', 'Sun pays nobody and everybody.'],
  ] },
  { tags: ['candlewick', 'day1'], lines: [
    "Oona's dawn is on Booking Day. A whole year she's been at it. Suvi says the middle's fine.",
    "Marit's got a guest from Spelt coming with a crock. Pell's lot. They know the same baker.",
    "Turn your worlds off at midnight, it's the Quiet tomorrow. No messages till the booking.",
  ] },
  { tags: ['candlewick', 'day2'], lines: [
    'Nothing to look at all day but each other. I quite like it.',
    'The whole block is sitting on its doorsteps. You can hear the lifts going by empty.',
    'The Quiet the court lamps stuck on, we sat out there till lamp-dawn telling stories.',
  ] },

  // Streets.
  { tags: ['ladle-row'], lines: [
    'Walk spinward and it looks uphill all the way, and it never gets any steeper.',
    'Morning. Where have you slept? Good. And have you eaten?',
    "That's the guest from Spelt. Pell's lot. Be nice; they bake.",
    'The hall opens at half eleven. Follow the smell of broth.',
    "Running for the hall? Run anti, you'll be lighter. You'll still be late.",
  ] },
  { tags: ['ladle-row', 'kids'], lines: [
    ['Race you anti.', 'You always pick anti.'],
    "Spinward's for losing. Everybody knows that.",
  ] },
  { tags: ['thread-street'], lines: [
    'On Thread Street you can run either way and nobody wins.',
    ['Is Wim in?', 'His lamp\'s on, so yes. He mends with the door open.'],
    'Every second coat on this street has a seam you could read like a letter.',
    'Jory has his shelves measured already. Marit pretends she has not noticed.',
  ] },
  { tags: ['thread-street', 'day3'], lines: [
    "Priya's dyed half the block green for Booking Day. The other half is bruise.",
    'Sprig of chervil in every buttonhole. It wilts by noon and nobody minds.',
  ] },

  // Shops.
  { tags: ['greengrocer'], lines: [
    "Half a kay for a tomato. I'm not buying it, I'm visiting it.",
    ['An apple, wrapped?', "For a dinner. You don't buy an apple for yourself."],
    "Point, don't tap. Fausta's glass is older than Fausta.",
    'Four careful slices of cucumber each. That is a party.',
  ] },
  { tags: ['bakery'], lines: [
    "Sugar bun's cheaper than a tomato. That's the whole of economics, my dad says.",
    ['Is the loaf yours?', "It's Lovage's. I sell it. I don't lie about it. Much."],
    'Four in the morning. The proving shelf sits on the loop, so the warmth is free.',
    "A bag of puffs for the walk and one for the person you're walking to.",
  ] },
  { tags: ['mender'], lines: [
    "He's put the patch in gold thread. Now everyone will ask how I tore it.",
    ['Whose coat was this?', "Your great-aunt's. That's her darn, there. And that one's mine."],
    'New shoes are twenty kays. A resole is eleven and an hour of Wim telling you why.',
  ] },
  { tags: ['dyer'], lines: [
    'Green or bruise. Half the block cannot decide and the other half wants both.',
    ['How long?', 'By morning. Dye weighs nothing. Drying takes the night.'],
    "Lumi's been rose all week. Her mother is testing the vat.",
    'A tenth of a kay to be a different person on Booking Day. Cheapest thing in the drum.',
  ] },
  { tags: ['flutes'], lines: [
    'That note. Hold it. No, longer. In heliox it should ring the whole shop.',
    ['Why so long?', 'The air is quick. The pipe has to be slow.'],
    'He measured my arms before he let me touch one. Then he gave me the short one anyway.',
  ] },
  { tags: ['studio'], lines: [
    "The middle's too slow, she says. Again. We'll run it from the rose.",
    ['Is that the River?', "It's the River's edges. Bruise. She's been at it seventy years."],
    "Don't breathe on the sunline. It's the length of my arm and it cost a week.",
  ] },
  { tags: ['studio', 'day2'], lines: [
    'She ran the whole dawn on the model three times and said nothing at all. That is good.',
    'The model Hollow has a lake the size of a plate. She made the far bank first.',
  ] },
  { tags: ['books'], lines: [
    "Tonight's letter took seven years to get here. Jory reads it once. Then it's gone.",
    ['Can I hear it again?', "No. That's what makes you listen."],
    'Felt on every wall. In heliox a whisper carries, and so does a cough.',
  ] },
  { tags: ['books', 'day2'], lines: [
    'No new letters on the Quiet. He reads an old one, slowly, and nobody coughs.',
  ] },
  { tags: ['chairs'], lines: [
    'A new chair costs fifty dinners. Sit in this one. Older than both of us.',
    ['Can you make it new?', 'I can make it better. New is a different shop, and a sadder one.'],
    'They came in for a sofa and went out with their grandparents\' sofa and a plan.',
  ] },
  { tags: ['toys'], lines: [
    "The wooden cab's back. Gimbal's stiff. I'll have it swinging by tomorrow.",
    "Every toy here has been mended at least twice. The doll's been mended nine times.",
  ] },
  { tags: ['toys', 'kids'], lines: [
    ['Can I keep it?', "You can borrow it till you're bored. That's longer than keeping."],
    "I had the model drum last week. You drop the bead and it goes anti. Every time.",
  ] },
  { tags: ['teacart'], lines: [
    'Long pour, please. I like to watch it miss.',
    ["It's landing off.", "It's landing anti. That's the drum, not my aim."],
    "Cups come back. Any cart, any corner. Ben's got cups older than me.",
  ] },
  { tags: ['teacart', 'morning'], lines: [
    'Coffee, lidded, and nothing else said till I have drunk it.',
  ] },
  { tags: ['larder'], lines: [
    'A crock of miso and a crock of sour. The crocks come back, Zhenya. I know.',
    ['Black garlic?', "Five weeks on the loop. Sweet as fruit, and it doesn't care what you think."],
    'A good larder holds fifty-five days. Zhenya says a proud one holds sixty.',
  ] },
  { tags: ['herbs'], lines: [
    "A sprig for a host. Never gin. Gin says you didn't think.",
    ['Rue?', 'For a joke. Nobody eats it twice.'],
    "Three hundredths of a kay and it says thank you better than I can.",
  ] },
  { tags: ['herbs', 'day3'], lines: [
    'Chervil for Booking Day. The whole block will have a sprig in its buttonhole by nine.',
  ] },
  { tags: ['clinic'], lines: [
    "Nkem's taken my blood pressure every month for fifteen years. Best conversation I get.",
    ['Busy?', 'Not really. Mostly people come to sit in the chair by the door.'],
  ] },

  // School and spinball.
  { tags: ['school', 'kids'], lines: [
    'Axis flies true, spin sinks, anti floats. Everybody knows that.',
    ['Throw it anti.', "Anti's for little ones. Watch this spin."],
    'Lucan says I am wrong about the ball and right about the drum.',
    "When I'm eight I'm going to the Window. I'm taking my aunt, not my mum.",
    'The River is like a road made of sugar, with holes in it where the rafts are.',
    'Twenty minutes at the light panel. Then you are allowed to be awake.',
  ] },
  { tags: ['school', 'kids', 'day1'], lines: [
    "No school tomorrow. It's the Quiet. I'm going to sit with Augusta. She's a hundred and four.",
  ] },
  { tags: ['spinball-hall', 'kids'], lines: [
    ['That was over the line.', 'It broke over the line. Spin sinks.'],
    "Kwame's repainted the anti side again. We wore it off in a week.",
    'Rafe takes it seriously. He takes everything seriously. He took breakfast seriously.',
    'Throw along the hall if you want it to go where you mean. Throw across if you want to win.',
  ] },

  // Lobbies, flats, terraces.
  { tags: ['lobby-a'], lines: [
    'Core A for the station, core B for the Hollow. Both have stairs, if you are brave.',
    ['Stairs?', "It's one deck. At nought point nine eight of a g. You'll live."],
  ] },
  { tags: ['lobby-b'], lines: [
    "Ninety seconds to the Hollow. By the top you'll weigh half what you do now.",
    "The cab's already in the berth. It always is. I've never once waited.",
  ] },
  { tags: ['flat-family', 'kids'], lines: [
    'Pip. Shoes. Pip. Your shoes. Both of them. On your feet.',
    ['Is the guest from Spelt really a baker?', 'Ask. Politely. Then ask for a bun.'],
    "Aunt Mina's coming for dinner. That means sesame tofu and no questions about it.",
  ] },
  { tags: ['flat-elders', 'elders'], lines: [
    'The lamps come up so slowly these days. Twenty minutes. In my day it was twenty minutes too.',
    ['The young couple paid the rent.', 'Then it goes to the great-grandchildren. As usual.'],
    "Put the kettle on the loop. It'll be warm when they want it.",
  ] },
  { tags: ['terraces', 'evening'], lines: [
    'Windows on the court. We pay for them by hearing everything.',
    "From the fifth terrace you can see right down into the hall's doors. Ramen, then.",
    'The herb shelves on this terrace are older than the flats behind them. Probably.',
  ] },

  // The Hollow.
  { tags: ['lake-pavilion'], lines: [
    "Everyone stops right here and looks up. Go on, it's allowed.",
    "There's someone on the far bank waving. Wave back. It's only polite.",
    ['How far is that?', "Three kilometres, straight up. You could see their shoes if you'd brought a glass."],
    'First step out of the cab is always too long. Half a g. You get used to it by the trees.',
  ] },
  { tags: ['hollow'], lines: [
    'Lovage holds its noon for twelve hours. We have six. Some of us vote to keep it that way.',
    ['Is that a kite over there?', "Over there is up there. Yes. It's aimed at us."],
    "Sorrel's elders have the lake every morning. Ours have the terraces and the gin.",
    'The air never moves in here unless somebody walks through it.',
  ] },
  { tags: ['hollow', 'day2'], lines: [
    "Half of Candlewick is on the lawns today, carefully not talking about tomorrow.",
    'My grandfather planted the third tree on that row, they say. He said it was the fourth.',
  ] },
  { tags: ['lakeshore'], lines: [
    ['Look how slow that wave is.', "Half a g. It's got all day."],
    'The lake goes up at both ends until the far shore stands on its side. I still find that rude.',
    "Swim out and look back. The shore you left is a hill.",
  ] },
  { tags: ['jetty'], lines: [
    "Count on the way down. You'll get further than on the rim.",
    ['Was that a dive?', 'It was a thought, followed by a dive.'],
    'Feet first if you are unsure. Head first if you are showing off. Both take a while.',
  ] },
  { tags: ['robe-house'], lines: [
    'Robe and a cup. Every swimmer. Even you, after that dive.',
    ["Ezra, I'm not cold.", "You're wet in heliox. You will be. Robe."],
  ] },
  { tags: ['orchard'], lines: [
    'Every blossom on this row by hand. Ladder, brush, next. Ladder, brush, next.',
    ['Who does the pollinating?', 'We do. From a ladder, with a brush, all day.'],
    'These trees are lit free. The sunline is on anyway.',
    "Dagny's crew sings while they brush. Says the blossom doesn't mind. It's for the crew.",
  ] },
  { tags: ['orchard', 'day2'], lines: [
    "Don't pick. Every apple's counted for the feast, and they'll count again.",
  ] },
  { tags: ['lawns'], lines: [
    "Lie on your back and look up. They're lying on their backs, looking down.",
    "A fifth of a square metre each, if everyone came at once. Today it's ours, so spread out.",
    'Shoes off. The grass is the only floor in the drum that is not a deck.',
  ] },
  { tags: ['kitefield', 'kids'], lines: [
    "Walk backwards. Backwards. There's no wind; you're the wind.",
    ['Is that a kite on the far bank?', "It's aimed at us. Wave."],
    'Tavi has flown that kite into the orchard four times. The kite has the patches to prove it.',
  ] },
  { tags: ['green', 'day3'], lines: [
    'Long tables for the blocks whose halls are full. Sit anywhere. Sit by someone.',
    'Reels on the Third from three. I will go if my knees agree.',
  ] },
  { tags: ['green', 'day3', 'evening'], lines: [
    ['Who won?', "Hall fund, by four. The band's playing anyway."],
    'Lamps on poles, and every table wants one more song.',
  ] },
  { tags: ['bandstand'], lines: [
    'Wait for it. Wait. There. The chord has come back off the far bank.',
    ['Why does he wait?', 'Nine and a bit seconds for the echo. He likes to hear us twice.'],
    "Kofi's over from Sorrel on the long horn again. Our horn player's flying tonight.",
  ] },
  { tags: ['back-foot'], lines: [
    'Down here by the wall the light falls away. Sorrel calls it the Dim End.',
    "The sunline stops short of the wall, look. You'd burn otherwise, flying up there.",
  ] },

  // The back terraces.
  { tags: ['dawn-terrace', 'day1', 'morning'], lines: [
    'Tidewater, by Hesper Moll. Nice enough. A bit green at the end.',
    ['Whose dawn?', "Hesper's. Not famous yet. Give her forty years."],
  ] },
  { tags: ['dawn-terrace', 'day2', 'morning'], lines: [
    'A plain dawn for the Quiet. Warm, then white. Some of us like it best.',
    "Marisol's here anyway. Coffee's the same on the Quiet. So is the cake.",
  ] },
  { tags: ['dawn-terrace', 'day3', 'morning'], lines: [
    'The queue started at five. Coffee, cake and the best seats on the wall.',
    ['Whose dawn is it?', "Oona's. That's her, in the queue, pretending not to be."],
    'Brown first. No, violet. Brown-violet. The River, she says.',
    "Look at the far bank. Gold. And we're still dark. Twenty minutes of it.",
    "That's it. It's an ordinary morning now. Clap.",
    'Too slow in the middle. She will say it. Watch. There. She said it.',
    "I've seen ninety-odd Booking Day dawns. Not one of them started brown.",
  ] },
  { tags: ['elders-terrace', 'elders'], lines: [
    "The young ones fly. We watch them fly. It's the better seat.",
    "A rug, a rail and a view of the whole Hollow. They can keep the high decks.",
  ] },
  { tags: ['elders-terrace', 'elders', 'day2'], lines: [
    'On the Quiet we sit up here and tell each other who used to sit up here.',
    "Ivo taught Oona to mix lamps when she was fifteen. He'll tell you. He'll tell you twice.",
  ] },
  { tags: ['elders-terrace', 'elders', 'day3', 'night'], lines: [
    "Ninety-one Booking Day dawns I've seen. That one I'll remember.",
    ['Too slow in the middle, she says.', "She always says that. She'll fix it next year."],
    'There go Candlewick. Ten o\'clock lot. You can tell by the wobbly lamps.',
    'I flew it every year till ninety. Then I started timing the others.',
    'A glass of gin and a rug. That is the Long Flight at my age, and I recommend it.',
  ] },
  { tags: ['third-terrace'], lines: [
    'Leap and you land a hand spinward. The reel walks itself round the wall.',
    ['Three times as high.', 'And it takes a while to come down. Smile on the way.'],
    'My grandmother danced the reel here at ninety. Slowly. Very high.',
  ] },
  { tags: ['spindle-lift'], lines: [
    'Hold the rail near the top. Down goes sideways. Then down goes away.',
    ['My stomach has moved.', 'So has down. Give it a minute.'],
    "Two minutes and a bit. Keep your bag on your knee or it'll leave without you.",
  ] },

  // The Spindle.
  { tags: ['flying-hall'], lines: [
    'Lengthwise to learn. Crosswise to show off. Aim wide.',
    ['I aimed at the hoop.', 'You aimed at where the hoop was. Aim at where it will be.'],
    'Big aunts hit the net. Everyone does, the first time. The hall claps.',
    "Stay inside the nets by day. Past them it's the sunline's air.",
  ] },
  { tags: ['sleeve-hire'], lines: [
    "Shoes on peg two hundred and six. Don't lose the token. People have flown home barefoot.",
    "Sleeves by the turn. An hour. Bertil counts the fins coming back.",
    ['Do these fit?', "Arms out. They fit. Everyone's the same shape in the air."],
  ] },
  { tags: ['spindle', 'day3', 'night'], lines: [
    'Lamps on. Stay with the block. If you drift, a red lamp will come and fetch you.',
    'Look along the axis. All those lights, as far as the end wall, like a slow river.',
    "Somewhere in there a choir is singing. High and strange. That'll be Connie's lot.",
    ["You weigh nothing.", "I've never weighed nothing before. I'd like to keep doing it."],
    "The sunline is just a cable tonight. Fly close. It's only dark spar.",
    'Marit and Jory are up ahead. She said something and he went very red.',
    'Three point seven five kilometres of air and not one wall in reach. Keep your lamp on.',
    ["Which way is down?", 'Out. Every way out. So stay in.'],
  ] },
  { tags: ['spindle', 'day3', 'night'], lines: [
    'Shift change at half eleven. Pennyfold and Hassock coming up. Drift toward the gate.',
    'Ayo turned me round with one hand and never stopped humming.',
  ] },
];

/*
 * Books, magazines, films. year = first publication (or release).
 * written / set: place ids where it was written and where it takes place.
 * kind: novel | poetry | prose | memoir | letters | magazine | film | photobook | play
 */
window.BEAT = window.BEAT || {};

BEAT.works = [
  {
    id: 'town-and-city', title: 'The Town and the City', by: ['kerouac'], year: 1950, kind: 'novel',
    publisher: 'Harcourt, Brace', written: ['ozone-park'], set: ['kerouac-birthplace', 'columbia'],
    text: 'Kerouac’s first novel, a long, Thomas Wolfe–style saga of the Martin family of “Galloway” (Lowell) and their scattering into wartime New York, where the Columbia circle appears in disguise. Respectfully reviewed, it sold poorly.',
  },
  {
    id: 'go', title: 'Go', by: ['holmes'], year: 1952, kind: 'novel', publisher: 'Scribner’s',
    written: [], set: ['vollmer-apt', 'times-square'],
    text: 'The first Beat novel: a roman à clef of the circle’s late-1940s New York, with Kerouac as Gene Pasternak, Ginsberg as David Stofsky and Cassady as Hart Kennedy. It appeared five years before On the Road.',
  },
  {
    id: 'junkie', title: 'Junkie', by: ['burroughs'], year: 1953, kind: 'novel',
    publisher: 'Ace Books (as “William Lee”)', written: ['orizaba'], set: ['times-square', 'new-waverly', 'algiers', 'orizaba'],
    text: 'A flat, exact account of addiction, from Times Square to New Orleans to Mexico City. Carl Solomon got it published as a 35-cent pulp paperback, bound back to back with a narcotics agent’s memoir.',
  },
  {
    id: 'gone-world', title: 'Pictures of the Gone World', by: ['ferlinghetti'], year: 1955, kind: 'poetry',
    publisher: 'City Lights (Pocket Poets 1)', written: [], set: [], press: 'city-lights',
    text: 'Number one in the Pocket Poets series: small, cheap, square paperbacks with black-bordered covers, made to fit a pocket. The format became the house style of the Beat poets.',
  },
  {
    id: 'howl', title: 'Howl and Other Poems', by: ['ginsberg'], year: 1956, kind: 'poetry',
    publisher: 'City Lights (Pocket Poets 4)', written: ['montgomery', 'milvia'], set: ['pilgrim-state', 'psych-institute'], press: 'city-lights',
    line: 'I saw the best minds of my generation destroyed by madness',
    text: '“Howl” moves from a catalogue of the best minds destroyed by madness, through the Moloch of industrial America, to a litany of solidarity with Carl Solomon in the asylum. Seized by U.S. Customs and tried for obscenity in 1957, it became the best-known poem of its generation.',
  },
  {
    id: 'defense-earth', title: 'In Defense of the Earth', by: ['rexroth'], year: 1956, kind: 'poetry',
    publisher: 'New Directions', written: [], set: [],
    text: 'Rexroth’s collection from the year of the San Francisco Renaissance, including his elegy for Dylan Thomas, “Thou Shalt Not Kill”, which he read to jazz at The Cellar.',
  },
  {
    id: 'on-the-road', title: 'On the Road', by: ['kerouac'], year: 1957, kind: 'novel', publisher: 'Viking',
    written: ['w20th'], set: ['paterson', 'larimer', 'central-city', 'welton', 'algiers', 'rocky-mount', 'times-square'], press: 'viking',
    line: 'the only people for me are the mad ones',
    text: 'Sal Paradise’s four trips across America and into Mexico with Dean Moriarty, written in a three-week burst on a 120-foot scroll in 1951, then rejected and revised for years before Viking took it. Published in September 1957, it made Kerouac famous overnight and gave a name and an itinerary to a generation.',
  },
  {
    id: 'evergreen-2', title: 'Evergreen Review no. 2: “San Francisco Scene”', by: ['ginsberg', 'kerouac', 'ferlinghetti', 'snyder', 'whalen', 'mcclure', 'rexroth'], year: 1957, kind: 'magazine',
    publisher: 'Grove Press', written: [], set: [],
    text: 'Grove Press’s new quarterly gave its second issue to the San Francisco poets, reprinting “Howl” and Kerouac’s “October in the Railroad Earth” and introducing the scene to readers across the country.',
  },
  {
    id: 'dharma-bums', title: 'The Dharma Bums', by: ['kerouac'], year: 1958, kind: 'novel', publisher: 'Viking',
    written: ['orlando'], set: ['milvia', 'six-gallery', 'matterhorn', 'rocky-mount', 'mill-valley', 'desolation'], press: 'viking',
    line: 'a great rucksack revolution',
    text: 'Ray Smith follows Japhy Ryder (Gary Snyder) up mountains and into Zen, imagining a “rucksack revolution” of young wanderers. Written in about ten days in Orlando, it became a sacred text for the backpackers and seekers of the 1960s.',
  },
  {
    id: 'subterraneans', title: 'The Subterraneans', by: ['kerouac'], year: 1958, kind: 'novel', publisher: 'Grove Press',
    written: [], set: ['san-remo'],
    text: 'Written in three nights in October 1953, a torrential account of Kerouac’s affair with a young Black woman in the Village bohemia of the San Remo, moved to San Francisco for publication. Ginsberg and Burroughs were so struck by its method that Kerouac wrote down his rules for them as “Essentials of Spontaneous Prose”.',
  },
  {
    id: 'gasoline', title: 'Gasoline', by: ['corso'], year: 1958, kind: 'poetry',
    publisher: 'City Lights (Pocket Poets 8)', written: [], set: [], press: 'city-lights',
    text: 'Corso’s first Pocket Poets book, with an introduction by Ginsberg: street-tough, funny, Shelley-haunted poems by the inner circle’s youngest member.',
  },
  {
    id: 'coney-island', title: 'A Coney Island of the Mind', by: ['ferlinghetti'], year: 1958, kind: 'poetry',
    publisher: 'New Directions', written: [], set: [],
    text: 'Conversational, painterly poems, some written to be read with jazz. It became one of the best-selling books of poetry ever published in the United States.',
  },
  {
    id: 'bird-backward', title: 'This Kind of Bird Flies Backward', by: ['diprima'], year: 1958, kind: 'poetry',
    publisher: 'Totem Press', written: [], set: [], press: 'yugen',
    text: 'Di Prima’s first book and Totem Press’s first, with an introduction by Ferlinghetti. Its tough, funny, street-smart poems announced a woman’s voice in a scene run by men.',
  },
  {
    id: 'yugen', title: 'Yugen', by: ['baraka', 'hjones'], year: 1958, kind: 'magazine',
    publisher: 'Totem Press', written: ['yugen'], set: [], press: 'yugen',
    text: 'Eight issues (1958–62) of a little magazine “for the new consciousness in arts and letters”, mixing Beats, Black Mountain poets and the New York School: Kerouac, Ginsberg, Corso, Burroughs, Snyder, Whalen, O’Hara, Olson.',
  },
  {
    id: 'americans', title: 'The Americans', by: ['frank'], year: 1959, kind: 'photobook',
    publisher: 'Grove Press (first published in Paris, 1958)', written: [], set: [],
    text: 'Eighty-three photographs from Frank’s 1955–56 road trips, grainy and tilted and unsentimental, now counted among the most influential photobooks ever made. Kerouac’s introduction to the American edition says Frank “sucked a sad poem right out of America onto film”.',
  },
  {
    id: 'pull-my-daisy', title: 'Pull My Daisy', by: ['frank', 'kerouac', 'ginsberg', 'corso', 'orlovsky'], year: 1959, kind: 'film',
    publisher: 'Directed by Robert Frank and Alfred Leslie', written: ['leslie-loft'], set: ['leslie-loft'],
    text: 'A 28-minute film adapted from the third act of Kerouac’s unproduced play The Beat Generation: a bishop comes to dinner at a railroad brakeman’s loft and the poets run riot. Kerouac improvised the narration.',
  },
  {
    id: 'naked-lunch', title: 'Naked Lunch', by: ['burroughs'], year: 1959, kind: 'novel',
    publisher: 'Olympia Press, Paris (Grove Press, 1962)', written: ['muniria', 'beat-hotel'], set: ['petit-socco', 'times-square', 'orizaba'], press: 'olympia',
    text: 'A nonlinear sequence of “routines” moving between New York, Mexico and Interzone, Burroughs’s nightmare version of Tangier: addiction, control and the body as horror-comedy. The 1962 American edition was banned in Boston; the state’s highest court cleared it in 1966.',
  },
  {
    id: 'doctor-sax', title: 'Doctor Sax', by: ['kerouac'], year: 1959, kind: 'novel', publisher: 'Grove Press',
    written: ['orizaba'], set: ['pawtucketville', 'kerouac-birthplace'],
    text: 'Kerouac’s Lowell boyhood as a gothic fantasy: the shadow-caped Doctor Sax, the castle on the hill, the 1936 flood and the World Snake. Written in Burroughs’s Mexico City apartment in 1952.',
  },
  {
    id: 'mexico-city-blues', title: 'Mexico City Blues', by: ['kerouac'], year: 1959, kind: 'poetry', publisher: 'Grove Press',
    written: ['orizaba'], set: ['orizaba'],
    text: '242 “choruses”, each the length of a notebook page, improvised like a jazz musician blowing on a theme. Kerouac wrote them in August 1955 in Mexico City.',
  },
  {
    id: 'riprap', title: 'Riprap', by: ['snyder'], year: 1959, kind: 'poetry', publisher: 'Origin Press, Kyoto',
    written: ['sourdough'], set: ['sourdough'], press: 'kyoto',
    text: 'Snyder’s first book, poems as solid and exact as the rock-work of a mountain trail crew, opening with “Mid-August at Sourdough Mountain Lookout”. Printed in Kyoto by Cid Corman’s Origin Press.',
  },
  {
    id: 'hymns-geryon', title: 'Hymns to St. Geryon', by: ['mcclure'], year: 1959, kind: 'poetry', publisher: 'Auerhahn Press',
    written: [], set: [],
    text: 'McClure’s first full collection, from Dave Haselwood’s small San Francisco press, which also printed Lamantia’s Ekstasis.',
  },
  {
    id: 'ekstasis', title: 'Ekstasis', by: ['lamantia'], year: 1959, kind: 'poetry', publisher: 'Auerhahn Press',
    written: [], set: [],
    text: 'Visionary, incantatory poems mixing Surrealism with the Catholic mystics, published the same year as Lamantia’s drug poems, Narcotica.',
  },
  {
    id: 'big-table', title: 'Big Table no. 1', by: ['burroughs', 'kerouac'], year: 1959, kind: 'magazine', publisher: 'Big Table, Chicago',
    written: [], set: [], press: 'uchicago',
    text: 'The Chicago Review material the University of Chicago would not print: ten episodes of Burroughs’s Naked Lunch and Kerouac’s “Old Angel Midnight”, plus Corso. The Post Office seized copies as obscene.',
  },
  {
    id: 'abomunist', title: 'Abomunist Manifesto', by: ['kaufman'], year: 1959, kind: 'prose', publisher: 'City Lights (broadside)',
    written: [], set: ['bagel-shop'], press: 'city-lights',
    text: 'A deadpan satire of manifestos, Cold War jargon and the Beat craze itself, from the poet North Beach regarded as its truest voice.',
  },
  {
    id: 'beatitude', title: 'Beatitude', by: ['kaufman', 'ginsberg'], year: 1959, kind: 'magazine', publisher: 'San Francisco',
    written: [], set: [],
    text: 'A mimeographed North Beach weekly started in 1959 by Bob Kaufman, Ginsberg, John Kelly and William Margolis to publish the street poets of the neighborhood.',
  },
  {
    id: 'minutes-to-go', title: 'Minutes to Go', by: ['burroughs', 'gysin', 'corso'], year: 1960, kind: 'prose', publisher: 'Two Cities, Paris',
    written: ['beat-hotel'], set: [],
    text: 'The first cut-up manifesto and anthology, made at the Beat Hotel by Gysin, Burroughs, Sinclair Beiles and Corso, who added a note disowning the method.',
  },
  {
    id: 'happy-birthday-death', title: 'The Happy Birthday of Death', by: ['corso'], year: 1960, kind: 'poetry', publisher: 'New Directions',
    written: [], set: [],
    text: 'Corso’s best-known collection, with “Marriage” (“Should I get married? Should I be good?”) and the mushroom-cloud-shaped “Bomb”.',
  },
  {
    id: 'like-i-say', title: 'Like I Say', by: ['whalen'], year: 1960, kind: 'poetry', publisher: 'Totem Press / Corinth Books',
    written: [], set: ['sourdough'], press: 'yugen',
    text: 'Whalen’s first full collection: wry, digressive, notebook-like poems from the lookouts and the city.',
  },
  {
    id: 'lonesome-traveler', title: 'Lonesome Traveler', by: ['kerouac'], year: 1960, kind: 'prose', publisher: 'McGraw-Hill',
    written: [], set: ['railroad-earth', 'desolation', 'orizaba', 'muniria'],
    text: 'Travel sketches from the railroad, the fire lookout, Mexico, Tangier and Europe, including “October in the Railroad Earth” and “Alone on a Mountaintop”.',
  },
  {
    id: 'tristessa', title: 'Tristessa', by: ['kerouac'], year: 1960, kind: 'novel', publisher: 'Avon',
    written: ['orizaba'], set: ['orizaba'],
    text: 'A short, devotional novel about a morphine-addicted Mexican woman Kerouac loved, written in Mexico City in 1955 and 1956.',
  },
  {
    id: 'kaddish', title: 'Kaddish and Other Poems', by: ['ginsberg'], year: 1961, kind: 'poetry', publisher: 'City Lights (Pocket Poets 14)',
    written: ['e2nd'], set: ['paterson', 'pilgrim-state'], press: 'city-lights',
    text: 'Ginsberg’s elegy for his mother Naomi: her paranoia, the hospitals, the lobotomy, the bus rides of his childhood, and the Kaddish no one said at her grave. Many readers rank it above “Howl”.',
  },
  {
    id: 'floating-bear', title: 'The Floating Bear', by: ['diprima', 'baraka'], year: 1961, kind: 'magazine', publisher: 'Mimeographed newsletter',
    written: [], set: [],
    text: 'A mimeographed newsletter mailed free to a few hundred readers, 1961–69. In 1961 the FBI arrested LeRoi Jones for mailing an “obscene” issue with work by Burroughs and Jones himself; a grand jury declined to indict.',
  },
  {
    id: 'suicide-note', title: 'Preface to a Twenty Volume Suicide Note', by: ['baraka'], year: 1961, kind: 'poetry', publisher: 'Totem Press / Corinth Books',
    written: [], set: [], press: 'yugen',
    text: 'LeRoi Jones’s first book of poems, intimate and bebop-quick, from the height of his Village years.',
  },
  {
    id: 'soft-machine', title: 'The Soft Machine', by: ['burroughs'], year: 1961, kind: 'novel', publisher: 'Olympia Press',
    written: ['beat-hotel'], set: [], press: 'olympia',
    text: 'The first book of the Nova trilogy, built from cut-ups of Burroughs’s own and others’ texts.',
  },
  {
    id: 'cuckoos-nest', title: 'One Flew Over the Cuckoo’s Nest', by: ['kesey'], year: 1962, kind: 'novel', publisher: 'Viking',
    written: [], set: [],
    text: 'Kesey’s novel of a psychiatric ward, drawn from his night shifts as an aide and his time as a volunteer in government drug experiments. Its success paid for La Honda and the bus.',
  },
  {
    id: 'big-sur', title: 'Big Sur', by: ['kerouac'], year: 1962, kind: 'novel', publisher: 'Farrar, Straus & Cudahy',
    written: [], set: ['bixby', 'vesuvio', 'los-gatos'],
    text: 'Kerouac’s unsparing account of his 1960 breakdown at Ferlinghetti’s cabin, written in Orlando in ten days in 1961. Fame, drink and paranoia close in; the book ends with the poem “Sea”.',
  },
  {
    id: 'yage-letters', title: 'The Yage Letters', by: ['burroughs', 'ginsberg'], year: 1963, kind: 'letters', publisher: 'City Lights',
    written: [], set: ['pucallpa'], press: 'city-lights',
    text: 'Burroughs’s 1953 letters to Ginsberg from his search for yagé in Colombia and Peru, with Ginsberg’s 1960 letter from Pucallpa describing his own visions.',
  },
  {
    id: 'dutchman', title: 'Dutchman', by: ['baraka'], year: 1964, kind: 'play', publisher: 'Cherry Lane Theatre',
    written: [], set: ['cherry-lane'],
    text: 'A one-act play: on a New York subway car a white woman taunts and seduces a young Black man until he answers her, and she kills him. It won the 1964 Obie for best American play.',
  },
  {
    id: 'desolation-angels', title: 'Desolation Angels', by: ['kerouac'], year: 1965, kind: 'novel', publisher: 'Coward-McCann',
    written: ['orizaba'], set: ['desolation', 'orizaba', 'muniria', 'beat-hotel'],
    text: 'The sequel in time to The Dharma Bums: Desolation Peak, then San Francisco, Mexico City with Ginsberg and Corso, Tangier with Burroughs, Paris and home, the last book about the years before fame.',
  },
  {
    id: 'solitudes', title: 'Solitudes Crowded with Loneliness', by: ['kaufman'], year: 1965, kind: 'poetry', publisher: 'New Directions',
    written: [], set: ['bagel-shop'],
    text: 'Kaufman’s first collection, with “Bagel Shop Jazz”, the “Abomunist Manifesto” and his jazz poems, published while he was keeping his vow of silence.',
  },
  {
    id: 'hunckes-journal', title: 'Huncke’s Journal', by: ['huncke'], year: 1965, kind: 'prose', publisher: 'Poets Press',
    written: [], set: ['times-square'],
    text: 'The first book by the man who gave the Beats their word, published by Diane di Prima’s Poets Press.',
  },
  {
    id: 'mishaps', title: 'Mishaps, Perhaps', by: ['solomon'], year: 1966, kind: 'prose', publisher: 'City Lights',
    written: [], set: ['psych-institute'],
    text: 'Short prose and reminiscences by the dedicatee of “Howl”.',
  },
  {
    id: 'satori', title: 'Satori in Paris', by: ['kerouac'], year: 1966, kind: 'novel', publisher: 'Grove Press',
    written: [], set: ['mazarine', 'brest'],
    text: 'A short, comic, rueful account of Kerouac’s ten-day trip to France in 1965 to search for his Breton ancestors.',
  },
  {
    id: 'vanity', title: 'Vanity of Duluoz', by: ['kerouac'], year: 1968, kind: 'novel', publisher: 'Coward-McCann',
    written: [], set: ['kerouac-birthplace', 'columbia', 'riverside', 'west-end'],
    text: 'The last novel published in Kerouac’s lifetime: football, Columbia, the war, the Kammerer killing, told to his wife in a tired, bitter, funny voice.',
  },
  {
    id: 'memoirs-beatnik', title: 'Memoirs of a Beatnik', by: ['diprima'], year: 1969, kind: 'novel', publisher: 'Olympia Press',
    written: [], set: [], press: 'olympia',
    text: 'Written for money for Maurice Girodias, a mix of real 1950s Village life and invented erotica that has become a classic of Beat women’s writing.',
  },
  {
    id: 'indian-journals', title: 'Indian Journals', by: ['ginsberg'], year: 1970, kind: 'prose', publisher: 'City Lights',
    written: ['varanasi'], set: ['varanasi'], press: 'city-lights',
    text: 'Notebooks, dreams and photographs from Ginsberg’s 1962–63 year in India.',
  },
  {
    id: 'revolutionary-letters', title: 'Revolutionary Letters', by: ['diprima'], year: 1971, kind: 'poetry', publisher: 'City Lights (Pocket Poets 27)',
    written: [], set: [], press: 'city-lights',
    text: 'Poems written as open letters to the counterculture, mixing practical survival advice with visionary politics.',
  },
  {
    id: 'first-third', title: 'The First Third', by: ['cassady'], year: 1971, kind: 'memoir', publisher: 'City Lights',
    written: [], set: ['larimer', 'salt-lake'], press: 'city-lights',
    text: 'Neal Cassady’s unfinished autobiography of his skid-row childhood, worked on from the late 1940s and published three years after his death.',
  },
  {
    id: 'visions-of-cody', title: 'Visions of Cody', by: ['kerouac'], year: 1972, kind: 'novel', publisher: 'McGraw-Hill',
    written: ['russell-st'], set: ['larimer', 'russell-st'],
    text: 'Kerouac’s most experimental book, a portrait of Neal Cassady assembled from sketches, transcripts of taped conversations with Neal, and an “Imitation of the Tape”. Written mostly in 1951–52; published in full only after his death.',
  },
  {
    id: 'fall-of-america', title: 'The Fall of America', by: ['ginsberg'], year: 1973, kind: 'poetry', publisher: 'City Lights (Pocket Poets 30)',
    written: [], set: [], press: 'city-lights',
    text: 'Ginsberg’s Vietnam-era road poems, many spoken into a tape recorder while crossing the country. It won the 1974 National Book Award.',
  },
  {
    id: 'ring-of-bone', title: 'Ring of Bone', by: ['welch'], year: 1973, kind: 'poetry', publisher: 'Grey Fox Press',
    written: [], set: ['kitkitdizze'],
    text: 'Lew Welch’s collected poems, edited by friends after his disappearance.',
  },
  {
    id: 'turtle-island', title: 'Turtle Island', by: ['snyder'], year: 1974, kind: 'poetry', publisher: 'New Directions',
    written: ['kitkitdizze'], set: ['kitkitdizze'],
    text: 'Poems and essays from the homestead on the San Juan Ridge, rooted in place and ecology. It won the 1975 Pulitzer Prize for poetry.',
  },
  {
    id: 'fast-speaking-woman', title: 'Fast Speaking Woman', by: ['waldman'], year: 1975, kind: 'poetry', publisher: 'City Lights (Pocket Poets 33)',
    written: [], set: [],
    text: 'Waldman’s chant poem, modeled on a Mazatec healing ritual, which she performed on the Rolling Thunder Revue tour.',
  },
  {
    id: 'clean-asshole', title: 'Clean Asshole Poems & Smiling Vegetable Songs', by: ['orlovsky'], year: 1978, kind: 'poetry', publisher: 'City Lights (Pocket Poets 37)',
    written: [], set: [], press: 'city-lights',
    text: 'Orlovsky’s only full collection: plainspoken, misspelled on purpose, tender and strange.',
  },
  {
    id: 'minor-characters', title: 'Minor Characters', by: ['jjohnson'], year: 1983, kind: 'memoir', publisher: 'Houghton Mifflin',
    written: [], set: ['newsstand', 'columbia'],
    text: 'Joyce Johnson’s memoir of the 1950s from the side of the women who were cast as extras in the men’s story. It won the National Book Critics Circle Award.',
  },
  {
    id: 'western-lands', title: 'The Western Lands', by: ['burroughs'], year: 1987, kind: 'novel', publisher: 'Viking',
    written: ['lawrence'], set: [],
    text: 'The last book of the Red Night trilogy, a meditation on death and the Egyptian afterlife written in Lawrence.',
  },
  {
    id: 'off-the-road', title: 'Off the Road', by: ['ccassady'], year: 1990, kind: 'memoir', publisher: 'William Morrow',
    written: [], set: ['russell-st', 'los-gatos'],
    text: 'Carolyn Cassady’s memoir of twenty years with Neal and Jack, correcting the legend from the house they kept coming back to.',
  },
  {
    id: 'hettie-jones', title: 'How I Became Hettie Jones', by: ['hjones'], year: 1990, kind: 'memoir', publisher: 'E. P. Dutton',
    written: [], set: ['yugen', 'cooper-sq'],
    text: 'Hettie Jones’s memoir of downtown New York, an interracial marriage, and the making of Yugen.',
  },
  {
    id: 'guilty', title: 'Guilty of Everything', by: ['huncke'], year: 1990, kind: 'memoir', publisher: 'Paragon House',
    written: [], set: ['times-square', 'new-waverly'],
    text: 'Huncke’s autobiography, from Chicago childhood to Times Square to Texas, told in his calm, unapologetic voice.',
  },
  {
    id: 'hippos', title: 'And the Hippos Were Boiled in Their Tanks', by: ['kerouac', 'burroughs'], year: 2008, kind: 'novel', publisher: 'Grove Press (written 1945)',
    written: ['vollmer-apt'], set: ['riverside', 'west-end'],
    text: 'A hard-boiled novel of the Kammerer killing, written in alternating chapters by Kerouac and Burroughs in 1945 and held back for decades, partly out of respect for Lucien Carr. Published after his death.',
  },
  {
    id: 'cowen-poems', title: 'Poems and Fragments', by: ['cowen'], year: 2014, kind: 'poetry', publisher: 'Ahsahta Press',
    written: [], set: [],
    text: 'The poems of Elise Cowen that survived her family’s destruction of her notebooks, edited by Tony Trigilio.',
  },
];

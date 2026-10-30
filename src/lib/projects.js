// ─────────────────────────────────────────────────────────────────────
//  Games & work index — ONE source of truth for /games and /about.
//
//  `kind` ('personal' | 'work') splits every entry between the two pages:
//  the personal entries are the games, the work entries are the career.
//  Authored order is display order (newest first), on both pages and in the
//  brain.
//
//  Surfaces that read this file want different amounts of it:
//    • the home page's brain (Games lobe) — a compact accordion, so it uses
//      `details` + `tags` + `href` and shows only `featured` ones.
//      (The brain's Work Experience lobe is authored separately, in +page.svelte.)
//    • /games — every personal entry as a full card, which additionally uses
//      `period`, `status` and the longer `context`.
//    • /about — a compact "What I've built" list of the games (`details`,
//      `status`, `image`) and a Career list of the work entries: `role`,
//      `period`, `details`, `logo`.
//    • the home banner (+layout.svelte) — the newest game's `title`, `tagline`
//      and `href`.
//
//  Media, in the order a surface should prefer it: `video` > `gif` > `image`
//  > `logo`. `image` stays the still used for thumbnails and as the video's
//  poster, so a heavy clip is only ever fetched where it's actually played.
//  `logo` is the fallback the (media-less) work entries lean on.
// ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} Project
 * @property {string} slug
 * @property {string} title
 * @property {'personal'|'work'} kind
 * @property {string} details   short blurb (brain accordion + grid card)
 * @property {string} [tagline] one-liner for the home banner, which plugs the
 *   first game that has one — move it to each new game when it launches
 * @property {string} [platform] where it's played, when that isn't the web —
 *   /games gives each platform its own section (e.g. 'Steam')
 * @property {string} context   the longer story (grid card only)
 * @property {string} period    human-readable span, e.g. '2025 — 2026'
 * @property {string} year      sort key: the year it was created
 * @property {string} status    one-word state: Sold / Live / Current / Past …
 * @property {string[]} tags
 * @property {string} [role]    job title — work entries only
 * @property {string} [href]
 * @property {string} [post]    blog slug, when there's a write-up
 * @property {string} [image]
 * @property {string} [imageBg] colour behind a letterboxed `image` — set it to
 *   the image's own edge colour so the bars disappear instead of showing the
 *   card's accent
 * @property {string} [video]
 * @property {string} [gif]
 * @property {string} [logo]    thumbnail fallback (work entries)
 * @property {boolean} [featured]   shown in the home page's brain — EXACTLY FOUR.
 *   The brain lights one hand-drawn anatomical region per accordion item, and
 *   `brainRegions` in routes/+page.svelte holds seven of them: the featured
 *   projects take the first four in order, and the Work Experience entries
 *   (authored in +page.svelte) pick theirs by index with `region`. A fifth
 *   `featured` would light region five, which belongs to a job. Promoting a
 *   project here means demoting another until an eighth region is drawn.
 */

/** @type {Project[]} */
export const projects = [
	{
		slug: 'stemble',
		kind: 'work',
		title: 'Stemble',
		role: 'Senior Software Engineer',
		details:
			'Building 3D lab simulations that let students run real experiments in the browser, and working on the platform underneath them.',
		context:
			'I build interactive 3D lab simulations for STEM courses, and work across the platform that serves them.',
		period: 'Aug 2026 — present',
		year: '2026',
		status: 'Current',
		tags: ['3D lab sims', 'Platform', 'STEM'],
		href: 'https://stemble.com',
		logo: '/logos/stemble.svg'
	},
	{
		slug: 'brilliant',
		title: 'Brilliant.org',
		kind: 'work',
		role: 'Senior Software Engineer, Interactives',
		details:
			'Building the interactive learning experiences that make complex STEM concepts click.',
		context:
			"I worked on the interactives team, building interactive gamified widgets for learning STEM concepts. This including designing authorable API's for each interactive, implementing in Elm/SVG, and ensuring each interactive works across wildly different lesson formats.",
		period: 'Sept 2025 — July 2026',
		year: '2025',
		status: 'Most recent',
		tags: ['Interactives', 'ELM / TS', 'AI-interoperable'],
		href: 'https://brilliant.org',
		logo: '/logos/brilliant.png'
	},
	{
		slug: 'squigdle',
		title: 'Squigdle',
		kind: 'personal',
		tagline: 'a daily drawing game. Play today’s Squigdle',
		details:
			'A daily drawing game. Everyone gets the same three squiggles: move them, spin them, and doodle them into a picture with limited ink. Then vote on everyone else’s.',
		context:
			'Launched October 2026, the second daily game served from this site after Lawndle. Unlike Lawndle it has a real backend: drawings, votes and rankings live in D1, with sign-in, moderation and a server-rendered share card for every doodle.',
		period: '2026 — present',
		year: '2026',
		status: 'New',
		tags: ['Solo Project', 'Daily Drawing', 'Preact / D1'],
		href: 'https://johalloran.dev/squigdle/',
		// Today's squiggles on a blank sheet, rendered by the game itself, so the
		// poster changes daily.
		image: 'https://johalloran.dev/squigdle/img/today-og.png',
		imageBg: '#efe6d2',
		video: '/projects/squigdle/Squigdle-quick.mp4',
		featured: true
	},
	{
		slug: 'lawndle',
		title: 'Lawndle',
		kind: 'personal',
		details:
			'A daily mowing puzzle. Cut every blade of grass on the lawn and park back in the shed, in as few steps as you can.',
		context:
			'Launched August 2026, and the first of the daily games to live on this site rather than a domain of its own. Almost entirely client-side: the levels ship as JSON in the bundle and the only server it talks to is the one endpoint behind the score distribution.',
		period: '2026 — present',
		year: '2026',
		status: 'New',
		tags: ['Solo Project', 'Daily Puzzle', 'PixiJS / Preact'],
		href: 'https://johalloran.dev/lawndle',
		image: 'https://johalloran.dev/lawndle/icons/hero.png',
		// PLACEHOLDER: this is a copy of the Squishy Billiards clip, standing in
		// until a real Lawndle capture exists. Drop the new file at the same path
		// and nothing here needs to change.
		video: '/projects/lawndle/gameplay.mp4',
		featured: true
	},
	{
		slug: 'squishy-billiards',
		title: 'Squishy Billiards',
		kind: 'personal',
		details:
			'Pool, with a gooey chaotic twist. A daily pool puzzle game, built in PixiJS with custom physics.',
		context:
			'This game is my follow-up after selling Kinda Hard Golf. Built in a few weeks, currently averaging 1k DAU, and is growing by the day.',
		period: '2026 — present',
		year: '2026',
		status: 'Live',
		tags: ['Solo Project', 'Custom Physics', 'PixiJS'],
		href: 'https://squishybilliards.com',
		post: 'squishy-billiards',
		image: 'https://squishybilliards.com/hero.jpg',
		video: '/projects/squishybilliards/squishy-billiards-gameplay.mp4',
		featured: true
	},
	{
		slug: 'kinda-hard-golf',
		title: 'Kinda Hard Golf',
		kind: 'personal',
		details:
			'A daily golf game I built solo in PixiJS over a few weeks. It struck a chord, played by over 4 million players to date and a steady 10k DAU.',
		context:
			"This idea hit me and I prototyped it in an evening. I launched it a few weeks later and snowballed very quickly. After the game's 400th daily level I sold the IP to a group of daily-game veterans.",
		period: '2025 — 2026',
		year: '2025',
		status: 'Sold',
		tags: ['4M+ players', 'Solo Project', 'Sold the IP'],
		href: 'https://kindahardgolf.com',
		post: 'kinda-hard-golf-sold',
		image: 'https://kindahardgolf.com/hero.jpg',
		video: '/projects/kindahardgolf/gameplay.mp4',
		// Featured despite being sold: it's the one most people know. It took
		// the brain region the "Earlier work" job entry used to have, and its
		// panel carries a "Sold to new owners" ribbon (see +page.svelte).
		featured: true
	},
	{
		slug: 'iron-fox-games',
		title: 'Iron Fox Games',
		kind: 'work',
		role: 'Staff Software Engineer · Team Lead, Web',
		details:
			'Led the web team building games for Poki.com in TypeScript, PixiJS, Three.js and React — played by millions globally. Spearheaded a rebuild of the team’s tech stack that cut load times 10×.',
		context:
			"At Iron Fox I helped lead a ground-up rebuild of the team's web engine, and helped build multiple 3d web games such as Up Together, Obby Tag, Driverz Ed, and more in rapid timelines.",
		period: 'Mar 2024 — Sept 2025',
		year: '2024',
		status: 'Past',
		tags: ['Team lead', 'PixiJS / Three.js', '10× faster loads'],
		logo: '/logos/iron_fox_games_logo.jpeg'
	},
	{
		slug: 'miner-meltdown',
		title: 'Miner Meltdown',
		kind: 'personal',
		details:
			'A 2d 4v4 multiplayer game. I built solo and shipped on Steam over several years, growing it to 25,000+ players on a shoestring budget before selling the IP in 2020.',
		context:
			"I built the game's netcode, procedural levels, drop-in/drop-out multiplayer, and handled all business operations. A fun game, that proved to be a huge learning experience for me in my career's early years.",
		period: '2015 — 2020',
		year: '2015',
		status: 'Sold',
		tags: ['Steam', '25k+ players', 'Sold the IP in 2020'],
		href: 'https://store.steampowered.com/app/426190/Miner_Meltdown/',
		platform: 'Steam',
		image: '/projects/minermeltdown/minermeltdown.png',
		video: '/projects/minermeltdown/gameplay.mp4'
		// Not `featured`: the brain has room for exactly four — see the note on
		// `featured` in the typedef above. Lawndle took this slot in Aug 2026.
	},
	// {
	// 	slug: 'draftorders',
	// 	title: 'DraftOrders.com',
	// 	kind: 'personal',
	// 	details:
	// 		'A tiny tool to solve the question: "who picks first?" into a spectacle. Randomised Fantasy Football draft orders with a bit of pizzazz.',
	// 	context:
	// 		'Built in an evening because my fantasy league moved away, and we needed a fun . It is not pretty, but it has quietly been settling draft orders every season since.',
	// 	period: '2022',
	// 	year: '2022',
	// 	status: 'Live',
	// 	tags: ['Weekend build', 'Silly tool'],
	// 	href: 'https://draftorders.com',
	// 	image: '/projects/draftorders/draftorders.png',
	// 	post: 'introducing-draftorders'
	// },
	{
		slug: 'forestry-tinacms',
		title: 'Forestry.io / TinaCMS',
		kind: 'work',
		role: 'Senior Software Engineer · Team Lead, Enterprise',
		details:
			'Six years of turning a Git-backed CMS into an enterprise product. Over my time at Forestry, I led the Enterprise team on Forestry CMS, led the Tina Cloud team, and worked as Product Manager on the open-source TinaCMS product.',
		context:
			'I led several different teams over my time at Forestry, while acting as an IC contributor along the way. ForestryCMS & TinaCMS needed to work with an ever-changing frontend ecosystem, and I helped provide the technical oversight to steer the product',
		period: 'Oct 2017 — Dec 2023',
		year: '2017',
		status: 'Past',
		tags: ['DevTools', 'GraphQL', 'SSO / RBAC'],
		href: 'https://tina.io',
		logo: '/logos/tinacms.jpg'
	}
];

/** The subset the home page's brain shows, in the order authored above. */
export const featuredProjects = projects.filter((p) => p.featured);

/** Everything /games shows: the personal entries, in authored order. */
export const games = projects.filter((p) => p.kind === 'personal');

/** The career entries /about lists. */
export const work = projects.filter((p) => p.kind === 'work');

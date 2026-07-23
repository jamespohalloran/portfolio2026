// ─────────────────────────────────────────────────────────────────────
//  Personal project index — ONE source of truth.
//
//  Two places render these and they want different amounts of it:
//    • the home page's brain (Personal Projects lobe) — a compact accordion,
//      so it uses `details` + `tags` + `href` and shows only `featured` ones.
//    • /projects — the full grid, which additionally uses `period`, `year`,
//      `status` and the longer `context`.
//  Keeping them in one file is what stops the two drifting apart.
//
//  Media, in the order a surface should prefer it: `video` > `gif` > `image`.
//  `image` stays the still used for thumbnails and as the video's poster, so a
//  heavy clip is only ever fetched where it's actually played.
// ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {object} Project
 * @property {string} slug
 * @property {string} title
 * @property {string} details   short blurb (brain accordion + grid card)
 * @property {string} context   the longer story (grid card only)
 * @property {string} period    human-readable span, e.g. '2025 — 2026'
 * @property {string} year      sort key: the year it was created
 * @property {string} status    one-word state: Sold / Live / Archived
 * @property {string[]} tags
 * @property {string} [href]
 * @property {string} [post]    blog slug, when there's a write-up
 * @property {string} [image]
 * @property {string} [video]
 * @property {string} [gif]
 * @property {boolean} [featured]  shown in the home page's brain
 */

/** @type {Project[]} */
export const projects = [
	{
		slug: 'kinda-hard-golf',
		title: 'Kinda Hard Golf',
		details:
			'A daily golf game I built solo in PixiJS over a few weeks. It struck a chord — over 4 million players to date and a steady 10k DAU.',
		context:
			'Started as a few-week itch and turned into a daily habit for tens of thousands of people. I hand-placed every tile of every level in the early days — auto-tiling did not exist until day 100 — and spent the next year turning that into a real content pipeline. After the 400th daily level I sold the IP to a group of daily-game veterans.',
		period: '2025 — 2026',
		year: '2025',
		status: 'Sold',
		tags: ['4M+ players', '10k DAU', 'Sold the IP'],
		href: 'https://kindahardgolf.com',
		post: 'kinda-hard-golf-sold',
		image: 'https://kindahardgolf.com/hero.jpg',
		video: '/projects/kindahardgolf/gameplay.mp4',
		featured: true
	},
	{
		slug: 'squishy-billiards',
		title: 'Squishy Billiards',
		details:
			'Pool, with a gooey chaotic twist. A daily pool puzzle game, built in PixiJS with custom physics.',
		context:
			'Pool, with a gooey chaotic twist. A daily pool puzzle game, built in PixiJS with custom physics. Built in a few weeks, currently averaging 1k DAU.',
		period: '2026 — present',
		year: '2026',
		status: 'Live',
		tags: ['Daily levels', 'Physics toy', 'PixiJS'],
		href: 'https://squishybilliards.com',
		post: 'squishy-billiards',
		image: 'https://squishybilliards.com/hero.jpg',
		video: '/projects/squishybilliards/squishy-billiards-gameplay.mp4',
		featured: true
	},
	{
		slug: 'miner-meltdown',
		title: 'Miner Meltdown',
		details:
			'A 2d 4v4 multiplayer game. I built solo and shipped on Steam over several years, growing it to 25,000+ players on a shoestring budget before selling the IP in 2020.',
		context:
			'My longest solo run: a 2D multiplayer sabotage game in Unity, with its own netcode, matchmaking and a community that stuck around for years. Grew it to 25,000+ players on a shoestring marketing budget before selling the IP in 2020.',
		period: '2015 — 2020',
		year: '2015',
		status: 'Sold',
		tags: ['Steam', '25k+ players', 'Sold the IP in 2020'],
		href: 'https://store.steampowered.com/app/426190/Miner_Meltdown/',
		image: '/projects/minermeltdown/minermeltdown.png',
		video: '/projects/minermeltdown/gameplay.mp4',
		featured: true
	},
	{
		slug: 'draftorders',
		title: 'DraftOrders.com',
		details:
			'A tiny tool to solve the question: "who picks first?" into a spectacle. Randomised Fantasy Football draft orders with a bit of pizzazz.',
		context:
			'Built in an evening because my fantasy league deserved better than a spreadsheet shuffle. It is not pretty, but it has quietly been settling draft orders every season since.',
		period: '2022',
		year: '2022',
		status: 'Live',
		tags: ['Weekend build', 'Silly tool'],
		href: 'https://draftorders.com',
		post: 'introducing-draftorders'
	},
];

/** The subset the home page's brain shows, in the order authored above. */
export const featuredProjects = projects.filter((p) => p.featured);

import { posts } from '$lib/posts';

// Prerendered to a static /sitemap.xml by adapter-static.
//
// This is a sitemap *index*, not a URL list. johalloran.dev serves content from
// more than one deploy: this SvelteKit site owns the root, and Lawndle (in the
// squishy-billiards monorepo) is mounted at /lawndle/ with its own
// /lawndle/sitemap.xml. Crawlers have no way to discover that sub-sitemap on
// their own, so we point at it from here — the URL already submitted to Search
// Console — and Google follows the index down to both children.
//
// The portfolio's own URLs moved to ../sitemap-pages.xml.
export const prerender = true;

const SITE = 'https://johalloran.dev';

// Newest post date, used as the pages sitemap's lastmod so publishing a post
// nudges crawlers to refetch it.
const latestPostDate = posts[0]?.date;

const sitemaps = [
	{ loc: `${SITE}/sitemap-pages.xml`, lastmod: latestPostDate },
	// Deployed from packages/games/lawndle in the squishy-billiards repo; that
	// file lists /lawndle/ and /lawndle/privacy. A sitemap at a subpath may only
	// list URLs at or below it, which it respects, so referencing it from the
	// root index is valid even though a different repo emits it.
	{ loc: `${SITE}/lawndle/sitemap.xml` },
	// Same arrangement for Squigdle: packages/games/squigdle/vite/sitemap.ts
	// emits /squigdle/ and /squigdle/privacy/.
	{ loc: `${SITE}/squigdle/sitemap.xml` }
];

export function GET() {
	const body =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		sitemaps
			.map(
				({ loc, lastmod }) =>
					`  <sitemap>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </sitemap>`
			)
			.join('\n') +
		`\n</sitemapindex>\n`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
}

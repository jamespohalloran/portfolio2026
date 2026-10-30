import { posts } from '$lib/posts';

// Prerendered to a static /sitemap-pages.xml by adapter-static.
//
// This is the portfolio's own URL list. It used to live at /sitemap.xml, which
// is now a sitemap index pointing here and at the separately-deployed
// /lawndle/sitemap.xml (see ../sitemap.xml/+server.js).
export const prerender = true;

const SITE = 'https://johalloran.dev';

// Top-level static routes. Blog posts are appended from $lib/posts below, so
// dropping a new Markdown file into src/lib/posts automatically adds its URL.
const staticPaths = ['/', '/about', '/games', '/blog', '/contact'];

export function GET() {
	// Annotated because the two spreads below infer different element shapes,
	// and destructuring `lastmod` off the resulting union trips checkJs.
	/** @type {Array<{ loc: string, lastmod?: string }>} */
	const urls = [
		...staticPaths.map((path) => ({ loc: SITE + path })),
		...posts.map((p) => ({ loc: `${SITE}/blog/${p.slug}`, lastmod: p.date }))
	];

	const body =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		urls
			.map(
				({ loc, lastmod }) =>
					`  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`
			)
			.join('\n') +
		`\n</urlset>\n`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
}

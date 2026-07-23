import { posts } from '$lib/posts';

// Prerendered to a static /sitemap.xml by adapter-static.
export const prerender = true;

const SITE = 'https://johalloran.dev';

// Top-level static routes. Blog posts are appended from $lib/posts below, so
// dropping a new Markdown file into src/lib/posts automatically adds its URL.
const staticPaths = ['/', '/about', '/projects', '/blog', '/contact'];

export function GET() {
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

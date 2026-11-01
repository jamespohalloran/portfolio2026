// Renders the per-page share cards into static/og/<name>.jpg.
//
//   node scripts/og.mjs
//
// Same card as social-james.jpg (which the home page keeps), with the role line
// under the name swapped per page. The design lives in design/og-card.svg;
// this only swaps the label, embeds the font, and screenshots it. og:image has
// to be a raster image (no scraper renders SVG), hence the JPEGs.
//
// It drives a local headless Chrome, which Cloudflare Pages' build image
// doesn't have, so this is NOT part of `npm run build`: run it after changing
// a card and commit the JPEGs.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// name → the line under "James O'Halloran". Pages use these via
// <Seo card="name" />; keep the two lists in step.
const CARDS = {
	games: 'Web Games',
	blog: 'Blog',
	about: 'Software Engineer',
	contact: 'Say Hello'
};

const CHROME =
	process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const root = resolve(import.meta.dirname, '..');
const url = (p) => pathToFileURL(join(root, p)).href;
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const out = join(root, 'static/og');
mkdirSync(out, { recursive: true });

const font = url('node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2');
const template = readFileSync(join(root, 'design/og-card.svg'), 'utf8')
	// The template is rendered from a temp dir, so its relative avatar path won't resolve.
	.replace('href="../static/james-avatar.png"', `href="${url('static/james-avatar.png')}"`)
	.replace('<style>', `<style>@font-face { font-family: 'Nunito'; src: url('${font}') format('woff2'); font-weight: 200 1000; }`);

const tmp = mkdtempSync(join(tmpdir(), 'og-'));
try {
	for (const [name, label] of Object.entries(CARDS)) {
		const svg = join(tmp, `${name}.svg`);
		const png = join(tmp, `${name}.png`);
		writeFileSync(svg, template.replace(/(<text id="label"[^>]*>)[^<]*/, `$1${escape(label)}`));
		execFileSync(CHROME, [
			'--headless',
			'--disable-gpu',
			'--hide-scrollbars',
			'--allow-file-access-from-files',
			'--force-device-scale-factor=1',
			'--window-size=1200,630',
			'--virtual-time-budget=2000', // let the font load and the highlight resize
			`--screenshot=${png}`,
			pathToFileURL(svg).href
		], { stdio: 'ignore' });
		execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', png, '-q:v', '2', join(out, `${name}.jpg`)]);
		console.log(`static/og/${name}.jpg  ${label}`);
	}
} finally {
	rmSync(tmp, { recursive: true, force: true });
}

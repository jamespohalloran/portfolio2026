import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * SvelteKit configuration — 100% static output.
 *
 * We use `adapter-static` so the whole site is prerendered to plain
 * HTML/CSS/JS at build time. There is no Node server at runtime, which
 * makes this deploy cleanly to Cloudflare Pages (point it at the `build`
 * directory as the output).
 *
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// Directory the prerendered pages are written to.
			pages: 'build',
			// Directory static assets (from /static) are copied to.
			assets: 'build',
			// `undefined` fallback = a pure static/multi-page build with no SPA
			// router fallback. Every route is prerendered ahead of time.
			// (Use '200.html' or 'index.html' here instead if you ever add
			// client-only dynamic routes that must resolve via SPA fallback.)
			fallback: undefined,
			// Emit clean directory-style URLs (/about/index.html).
			precompress: false,
			strict: true
		})
	}
};

export default config;

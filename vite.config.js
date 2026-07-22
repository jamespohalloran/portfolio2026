import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// Tailwind v4 runs as a first-class Vite plugin — it must come before
	// sveltekit(). No postcss.config.js or autoprefixer needed anymore.
	plugins: [tailwindcss(), sveltekit()],

	optimizeDeps: {
		esbuildOptions: {
			plugins: [
				{
					// Vite's cold-start dependency scanner runs raw esbuild, which
					// knows nothing about mdsvex. It sees the `import.meta.glob` in
					// src/lib/posts.js expand to `import { metadata } from './posts/*.md'`,
					// fails to find that export in the unprocessed Markdown, and aborts
					// with "Failed to scan for dependencies from entries".
					// Blog posts are local source (never prebundled deps), so mark them
					// external for the scanner only — the real dev/build pipeline still
					// compiles them through mdsvex normally.
					name: 'ignore-markdown-in-dep-scan',
					setup(build) {
						build.onResolve({ filter: /\.md$/ }, (args) => ({
							path: args.path,
							external: true
						}));
					}
				}
			]
		}
	}
});

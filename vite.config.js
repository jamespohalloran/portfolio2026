import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// Tailwind v4 runs as a first-class Vite plugin — it must come before
	// sveltekit(). No postcss.config.js or autoprefixer needed anymore.
	plugins: [tailwindcss(), sveltekit()]
});

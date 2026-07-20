import { error } from '@sveltejs/kit';
import { posts } from '$lib/posts';

// Load a single post: dynamically import its compiled mdsvex component plus
// the frontmatter. Vite turns the templated import into a glob, so every
// `src/lib/posts/*.md` is a valid target.
export async function load({ params }) {
	try {
		const post = await import(`../../../lib/posts/${params.slug}.md`);
		return {
			slug: params.slug,
			content: post.default,
			meta: post.metadata
		};
	} catch {
		throw error(404, `Post "${params.slug}" not found`);
	}
}

// Enumerate every slug so adapter-static can prerender each post page.
export function entries() {
	return posts.map((p) => ({ slug: p.slug }));
}

export const prerender = true;

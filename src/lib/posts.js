// ─────────────────────────────────────────────────────────────────────
//  Blog post index.
//
//  Every Markdown file in ./posts/*.md is a post. mdsvex compiles each one
//  to a Svelte component and exposes its YAML frontmatter as a `metadata`
//  named export. Here we glob just the frontmatter (not the compiled
//  component) to build a lightweight, date-sorted list for the blog index
//  and the "recent posts" strip on the home page.
//
//  To add a post: drop a new `.md` file in ./posts with the same frontmatter
//  shape (title, date, description). The slug is the filename.
// ─────────────────────────────────────────────────────────────────────

const frontmatter = import.meta.glob('./posts/*.md', {
	eager: true,
	import: 'metadata'
});

/** @type {Array<{ slug: string, title: string, date: string, description: string }>} */
export const posts = Object.entries(frontmatter)
	.map(([path, metadata]) => ({
		slug: path.split('/').pop().replace('.md', ''),
		...metadata
	}))
	// Newest first.
	.sort((a, b) => new Date(b.date) - new Date(a.date));

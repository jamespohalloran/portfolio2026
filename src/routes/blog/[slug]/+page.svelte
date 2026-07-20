<script>
	import { formatDate } from '$lib/formatDate';

	export let data;

	// The compiled post body is a component; hold it in a capitalized binding
	// so it can be rendered as <Content /> below.
	$: Content = data.content;
	$: meta = data.meta;
</script>

<svelte:head>
	<title>{meta.title} · James O'Halloran</title>
	<meta name="description" content={meta.description} />
</svelte:head>

<article class="mx-auto max-w-2xl px-6 py-16 sm:py-24">
	<a
		href="/blog"
		class="inline-flex items-center gap-1 text-sm font-bold text-charcoal-soft transition-colors hover:text-charcoal"
	>
		← All posts
	</a>

	<header class="mt-6">
		<time datetime={meta.date} class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">
			{formatDate(meta.date)}
		</time>
		<h1 class="mt-3 text-4xl font-extrabold tracking-tight text-charcoal sm:text-5xl">
			{meta.title}
		</h1>
	</header>

	<!-- mdsvex-rendered markdown. Styles live in the :global block below since
	     the content is an injected child component (out of Svelte's scope). -->
	<div class="post-body mt-10">
		<svelte:component this={Content} />
	</div>
</article>

<style>
	.post-body :global(p) {
		margin: 1.25rem 0;
		font-size: 1.075rem;
		line-height: 1.75;
		color: var(--color-charcoal-soft);
	}
	.post-body :global(h2) {
		margin: 2.5rem 0 1rem;
		font-size: 1.6rem;
		font-weight: 800;
		color: var(--color-charcoal);
	}
	.post-body :global(h3) {
		margin: 2rem 0 0.75rem;
		font-size: 1.3rem;
		font-weight: 800;
		color: var(--color-charcoal);
	}
	.post-body :global(a) {
		color: var(--color-charcoal);
		font-weight: 700;
		text-decoration: underline;
		text-decoration-thickness: 2px;
		text-underline-offset: 3px;
		text-decoration-color: var(--color-frontal);
	}
	.post-body :global(a:hover) {
		text-decoration-color: var(--color-charcoal);
	}
	.post-body :global(ul) {
		margin: 1.25rem 0;
		padding-left: 1.4rem;
		list-style: disc;
		color: var(--color-charcoal-soft);
	}
	.post-body :global(li) {
		margin: 0.4rem 0;
		line-height: 1.7;
	}
	.post-body :global(img),
	.post-body :global(video) {
		margin: 2rem 0;
		width: 100%;
		border-radius: var(--radius-cartoon);
		border: 3px solid var(--color-charcoal);
		box-shadow: var(--shadow-cartoon-sm);
	}
	.post-body :global(blockquote) {
		margin: 1.5rem 0;
		padding: 0.25rem 1.25rem;
		border-left: 4px solid var(--color-frontal);
		color: var(--color-charcoal-soft);
		font-style: italic;
	}
	.post-body :global(strong) {
		color: var(--color-charcoal);
		font-weight: 800;
	}
	.post-body :global(code) {
		background: var(--color-cream-deep);
		padding: 0.15em 0.4em;
		border-radius: 0.4rem;
		font-size: 0.9em;
	}
</style>

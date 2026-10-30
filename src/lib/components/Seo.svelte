<!-- Per-page title + description, and the social-card copies of both.

     These used to be split: pages set <title>/description, while og:title and
     twitter:title lived hard-coded in app.html — so every link preview, from
     any page, showed the home page's title. Keep all of them here, together,
     so they can't drift. -->
<script>
	/** @type {string} */
	export let title;
	/** @type {string} */
	export let description;
	/** Share image — must be an absolute URL, or scrapers (Facebook, LinkedIn,
	 *  iMessage) render the card without it. Defaults to the 1200×630 portrait card. */
	export let image = DEFAULT_IMAGE;
	/** 'article' for blog posts, which also want `published`. */
	export let type = 'website';
	/** @type {string | undefined} ISO date, articles only */
	export let published = undefined;
</script>

<script context="module">
	const DEFAULT_IMAGE = 'https://johalloran.dev/social-james.jpg';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta property="og:type" content={type} />
	<meta property="og:image" content={image} />
	<meta name="twitter:image" content={image} />
	{#if image === DEFAULT_IMAGE}
		<!-- Dimensions are only known for the default card. -->
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta property="og:image:alt" content="James O'Halloran - Daily Web Games" />
	{/if}
	{#if published}
		<meta property="article:published_time" content={published} />
	{/if}
</svelte:head>

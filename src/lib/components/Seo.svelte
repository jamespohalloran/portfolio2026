<!-- Per-page title + description, and the social-card copies of both.

     These used to be split: pages set <title>/description, while og:title and
     twitter:title lived hard-coded in app.html — so every link preview, from
     any page, showed the home page's title. Keep all of them here, together,
     so they can't drift. The share image stays a site-wide default in app.html. -->
<script>
	/** @type {string} */
	export let title;
	/** @type {string} */
	export let description;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
</svelte:head>

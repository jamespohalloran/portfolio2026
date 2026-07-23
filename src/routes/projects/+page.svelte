<!-- /projects — the full project & work archive (Frontal Lobe).

     The home page's brain shows a compact accordion of the featured personal
     projects; this is the version with room to breathe: every project AND the
     professional work, the dates each ran, its state, and a paragraph of
     context. A filter (All / Personal / Work) narrows the set; within whatever
     is showing, the `prominent` few render as big hero cards and the rest as a
     compact grid so the page scales as more entries are added.
     Everything reads from $lib/projects so nothing can drift apart. -->
<script>
	import { base } from '$app/paths';
	import { slide } from 'svelte/transition';
	import { projects } from '$lib/projects';

	const isExternal = (href) => !!href?.startsWith('http');
	const imgSrc = (img) => (img ? (img.startsWith('http') ? img : base + img) : null);
	// Thumbnail source: a real still if there is one, else the logo the (media-less)
	// work entries carry.
	const thumb = (p) => imgSrc(p.image ?? p.logo);

	// Filter tabs. Counts come straight off the data so they can't lie.
	const filters = [
		{ key: 'all', label: 'All' },
		{ key: 'personal', label: 'Personal' },
		{ key: 'work', label: 'Work' }
	];
	let filter = 'all';
	const count = (key) =>
		key === 'all' ? projects.length : projects.filter((p) => p.kind === key).length;

	$: shown = filter === 'all' ? projects : projects.filter((p) => p.kind === filter);
	$: prominent = shown.filter((p) => p.prominent);
	$: rest = shown.filter((p) => !p.prominent);

	// A compact card shows only a two-line teaser; its context + tags stay folded
	// behind a "See more" until asked for. Keyed by slug so the state survives a
	// filter change (and so two cards can't share one toggle).
	let expanded = {};
	const toggle = (slug) => (expanded = { ...expanded, [slug]: !expanded[slug] });

	// Hover-to-play, rather than several autoplaying clips fighting for bandwidth
	// on load: `preload="none"` means a card's video is only fetched once you
	// actually point at it, and until then the poster is all that's on the wire.
	// Touch devices never fire these, which is the intended fallback — they get
	// the still.
	function play(event) {
		const v = event.currentTarget.querySelector('video');
		v?.play?.().catch(() => {}); // interrupted by a fast mouse-out; harmless
	}
	function stop(event) {
		const v = event.currentTarget.querySelector('video');
		if (!v) return;
		v.pause();
		v.currentTime = 0;
	}
</script>

<svelte:head>
	<title>Projects · James O'Halloran</title>
	<meta
		name="description"
		content="Projects and professional work by James O'Halloran — daily web games, silly tools, a multiplayer game that ran for five years, and a decade of engineering roles."
	/>
</svelte:head>

<section class="mx-auto max-w-5xl px-6 py-20 sm:py-28">
	<div class="flex items-center gap-3">
		<span class="h-4 w-4 rounded-full bg-frontal ring-[3px] ring-charcoal"></span>
		<span class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">
			Projects &amp; Work
		</span>
	</div>
	<h1 class="mt-4 text-4xl font-extrabold tracking-tight text-charcoal sm:text-5xl">
		Things I've been working on
	</h1>
	<p class="mt-4 max-w-2xl text-lg text-charcoal-soft">
		Here's some of the projects I've been working on recently. Some solo, some as part of a team.
	</p>

	<!-- ── Filter tabs. Client-side only: the whole set is already on the page,
	     so filtering is a cheap reactive slice, no navigation. -->
	<div class="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter projects">
		{#each filters as f}
			{@const on = filter === f.key}
			<button
				type="button"
				role="tab"
				aria-selected={on}
				class="filter-tab {on ? 'filter-tab--on' : ''}"
				on:click={() => (filter = f.key)}
			>
				{f.label}
				<span class="filter-count">{count(f.key)}</span>
			</button>
		{/each}
	</div>

	<!-- ── Prominent: the headline few, as large cards. -->
	{#if prominent.length}
		<div class="mt-10 grid gap-8 md:grid-cols-2">
			{#each prominent as project (project.slug)}
				<!-- The whole card is a plain <article>, not a link: it carries two or
				     three destinations (the live site, the write-up), so making the card
				     itself clickable would leave the real links nested inside it. -->
				<article
					class="group flex flex-col overflow-hidden rounded-cartoon border-[3px] border-charcoal bg-white shadow-cartoon transition-transform duration-300 ease-bouncy hover:-translate-y-1"
				>
					<!-- ── Media. Clip when there is one (played on hover), else the still,
					     else the logo on a soft panel, else a big lettered tile so a card
					     without art still reads as a card and not as a broken image. -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div
						class="relative border-b-[3px] border-charcoal bg-frontal-soft"
						on:mouseenter={play}
						on:mouseleave={stop}
					>
						{#if project.video}
							<!-- svelte-ignore a11y-media-has-caption -->
							<video
								src={base + project.video}
								poster={imgSrc(project.image)}
								class="block h-48 w-full bg-charcoal object-contain sm:h-56"
								muted
								loop
								playsinline
								preload="none"
							></video>
						{:else if project.gif}
							<img
								src={base + project.gif}
								alt="{project.title} gameplay"
								class="block h-48 w-full bg-charcoal object-contain sm:h-56"
								loading="lazy"
							/>
						{:else if imgSrc(project.image)}
							<img
								src={imgSrc(project.image)}
								alt={project.title}
								class="block h-48 w-full object-contain sm:h-56"
								loading="lazy"
							/>
						{:else if project.logo}
							<!-- A logo blown up to media size looks like an ad, so it gets
							     generous padding and sits contained on the soft panel — reads
							     as a branded header, not a stretched image. -->
							<img
								src={imgSrc(project.logo)}
								alt={project.title}
								class="block h-48 w-full object-contain p-10 sm:h-56"
								loading="lazy"
							/>
						{:else}
							<div
								class="flex h-48 w-full items-center justify-center text-6xl font-extrabold text-charcoal/25 sm:h-56"
								aria-hidden="true"
							>
								{project.title.slice(0, 1)}
							</div>
						{/if}

						<!-- Status sits ON the media so the text column below stays one
						     clean column of prose. -->
						<span
							class="absolute right-3 top-3 rounded-full border-[3px] border-charcoal bg-white px-2.5 py-0.5 text-[0.68rem] font-extrabold uppercase tracking-widest text-charcoal shadow-cartoon-sm"
						>
							{project.status}
						</span>
					</div>

					<div class="flex flex-1 flex-col p-6">
						<span class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">
							{project.period}
						</span>
						<h2 class="mt-2 text-2xl font-extrabold leading-snug text-charcoal">
							{project.title}
						</h2>
						{#if project.role}
							<span class="mt-1 text-sm font-bold text-charcoal-soft">{project.role}</span>
						{/if}
						<p class="mt-2 text-charcoal-soft">{project.details}</p>
						<p class="mt-3 text-sm leading-relaxed text-charcoal-soft/90">{project.context}</p>

						{#if project.tags?.length}
							<div class="mt-4 flex flex-wrap gap-1.5">
								{#each project.tags as tag}
									<span class="proj-tag">{tag}</span>
								{/each}
							</div>
						{/if}

						<!-- Pushed to the bottom so every card's buttons line up across the
						     grid regardless of how long its blurb ran. -->
						<div class="mt-auto flex flex-wrap items-center gap-3 pt-6">
							{#if project.href}
								<a
									href={project.href}
									target={isExternal(project.href) ? '_blank' : undefined}
									rel={isExternal(project.href) ? 'noopener noreferrer' : undefined}
									class="btn-cartoon !bg-frontal !px-4 !py-2 text-sm"
								>
									Visit
									<span class="transition-transform group-hover:translate-x-0.5">→</span>
								</a>
							{/if}
							{#if project.post}
								<a
									href="{base}/blog/{project.post}"
									class="font-bold text-charcoal underline decoration-frontal decoration-2 underline-offset-4 hover:decoration-charcoal"
								>
									Read the story
								</a>
							{/if}
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}

	<!-- ── The rest, as a denser grid. Same data, less real estate: this is where
	     the archive grows. -->
	{#if rest.length}
		{#if prominent.length}
			<h2 class="mt-14 text-xs font-bold uppercase tracking-widest text-charcoal-soft">More</h2>
		{/if}
		<div class="mt-6 grid gap-5 sm:grid-cols-2">
			{#each rest as project (project.slug)}
				<article
					class="group flex gap-4 rounded-cartoon border-[3px] border-charcoal bg-white p-4 shadow-cartoon transition-transform duration-300 ease-bouncy hover:-translate-y-1"
				>
					<!-- Fixed square thumbnail so every row lines up regardless of art. -->
					<div
						class="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border-[3px] border-charcoal bg-frontal-soft"
					>
						{#if thumb(project)}
							<img
								src={thumb(project)}
								alt={project.title}
								class="h-full w-full object-contain p-1.5"
								loading="lazy"
							/>
						{:else}
							<span class="text-2xl font-extrabold text-charcoal/30" aria-hidden="true">
								{project.title.slice(0, 1)}
							</span>
						{/if}
					</div>

					<div class="flex min-w-0 flex-1 flex-col">
						<div class="flex items-baseline justify-between gap-2">
							<span class="text-[0.7rem] font-bold uppercase tracking-widest text-charcoal-soft">
								{project.period}
							</span>
							<span
								class="shrink-0 text-[0.7rem] font-bold uppercase tracking-widest text-charcoal-soft/70"
							>
								{project.status}
							</span>
						</div>
						<h3 class="mt-1 text-lg font-extrabold leading-snug text-charcoal">{project.title}</h3>
						{#if project.role}
							<span class="text-xs font-bold text-charcoal-soft">{project.role}</span>
						{/if}
						<p class="mt-1.5 text-sm text-charcoal-soft {expanded[project.slug] ? '' : 'line-clamp-2'}">
							{project.details}
						</p>

						<!-- Folded-away detail: the longer story and the tags, revealed by the
						     toggle below. Only the compact cards fold — the prominent ones
						     already show everything. -->
						{#if expanded[project.slug]}
							<div transition:slide|local={{ duration: 200 }}>
								{#if project.context}
									<p class="mt-2 text-sm leading-relaxed text-charcoal-soft/90">
										{project.context}
									</p>
								{/if}
								{#if project.tags?.length}
									<div class="mt-3 flex flex-wrap gap-1.5">
										{#each project.tags as tag}
											<span class="proj-tag">{tag}</span>
										{/each}
									</div>
								{/if}
							</div>
						{/if}

						<div class="mt-auto flex flex-wrap items-center gap-3 pt-3">
							<!-- Present only when there's actually more to unfold (context or
							     tags), so a bare card doesn't offer an empty expand. -->
							{#if project.context || project.tags?.length}
								<button
									type="button"
									class="inline-flex items-center gap-1 text-sm font-bold text-charcoal-soft hover:text-charcoal"
									aria-expanded={!!expanded[project.slug]}
									on:click={() => toggle(project.slug)}
								>
									{expanded[project.slug] ? 'See less' : 'See more'}
									<span
										class="transition-transform {expanded[project.slug] ? 'rotate-180' : ''}"
										aria-hidden="true">▾</span
									>
								</button>
							{/if}
							{#if project.href}
								<a
									href={project.href}
									target={isExternal(project.href) ? '_blank' : undefined}
									rel={isExternal(project.href) ? 'noopener noreferrer' : undefined}
									class="text-sm font-bold text-charcoal underline decoration-frontal decoration-2 underline-offset-4 hover:decoration-charcoal"
								>
									Visit
									<span class="transition-transform group-hover:translate-x-0.5">→</span>
								</a>
							{/if}
							{#if project.post}
								<a
									href="{base}/blog/{project.post}"
									class="text-sm font-bold text-charcoal underline decoration-frontal decoration-2 underline-offset-4 hover:decoration-charcoal"
								>
									Read the story
								</a>
							{/if}
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	.proj-tag {
		display: inline-block;
		border: 2px solid var(--color-charcoal);
		border-radius: 9999px;
		padding: 0.1rem 0.6rem;
		font-size: 0.7rem;
		font-weight: 800;
		color: var(--color-charcoal);
		background: var(--color-cream);
	}

	/* Filter pills. Cartoon-consistent: thick charcoal outline, the active one
	   fills in. The count rides along in a softer chip. */
	.filter-tab {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		border: 3px solid var(--color-charcoal);
		border-radius: 9999px;
		padding: 0.4rem 1rem;
		font-size: 0.9rem;
		font-weight: 800;
		color: var(--color-charcoal);
		background: #fff;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			background-color 0.2s ease,
			color 0.2s ease;
	}
	.filter-tab:hover {
		transform: translateY(-1px);
	}
	.filter-tab--on {
		background: var(--color-charcoal);
		color: var(--color-cream);
	}
	.filter-count {
		font-size: 0.7rem;
		font-weight: 800;
		opacity: 0.6;
	}
</style>

<!-- /projects — the full personal-project archive (Frontal Lobe).

     The home page's brain shows a compact, three-item accordion of the same
     data; this is the version with room to breathe: every project, the dates
     it ran, what state it's in now, and a paragraph of actual context.
     Both read from $lib/projects so they can't drift apart. -->
<script>
	import { base } from '$app/paths';
	import { projects } from '$lib/projects';

	const isExternal = (href) => !!href?.startsWith('http');
	const imgSrc = (img) => (img ? (img.startsWith('http') ? img : base + img) : null);

	// Hover-to-play, rather than three autoplaying clips fighting for bandwidth
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
		content="Personal projects by James O'Halloran — daily web games, silly tools, and a multiplayer game that ran for five years."
	/>
</svelte:head>

<section class="mx-auto max-w-5xl px-6 py-20 sm:py-28">
	<div class="flex items-center gap-3">
		<span class="h-4 w-4 rounded-full bg-frontal ring-[3px] ring-charcoal"></span>
		<span class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">
			Personal Projects
		</span>
	</div>
	<h1 class="mt-4 text-4xl font-extrabold tracking-tight text-charcoal sm:text-5xl">
		Things I built because I couldn't not build them
	</h1>
	<p class="mt-4 max-w-2xl text-lg text-charcoal-soft">
		Every few months an idea glues me to the keyboard for a couple of weeks. These are the ones that
		made it out — two of them ended up with new owners.
	</p>

	<div class="mt-12 grid gap-8 md:grid-cols-2">
		{#each projects as project (project.slug)}
			<!-- The whole card is a plain <article>, not a link: it carries two or
			     three destinations (the live site, the write-up), so making the card
			     itself clickable would leave the real links nested inside it. -->
			<article
				class="group flex flex-col overflow-hidden rounded-cartoon border-[3px] border-charcoal bg-white shadow-cartoon transition-transform duration-300 ease-bouncy hover:-translate-y-1"
			>
				<!-- ── Media. Clip when there is one (played on hover), else the still,
				     else a big lettered tile in the lobe colour so a card without art
				     still reads as a card and not as a broken image. -->
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
</style>

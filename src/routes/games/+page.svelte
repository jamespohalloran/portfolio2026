<!-- /games — every game, as a full card (Frontal Lobe).

     The home page's brain shows a compact accordion of the featured three;
     this is the version with room to breathe: every game, the dates it ran,
     its state, and a paragraph of context. The web games come first, so the
     top of the page is always something you can go and play today; games on
     other platforms (Steam) get their own section after.
     Everything reads from $lib/projects so nothing can drift apart. The
     professional work that used to share this page lives on /about now. -->
<script>
	import { base } from '$app/paths';
	import { games } from '$lib/projects';

	const isExternal = (href) => !!href?.startsWith('http');
	const imgSrc = (img) => (img ? (img.startsWith('http') ? img : base + img) : null);

	// Web games first, sold or not (a sold one is still playable, and its card
	// says it changed hands), then one section per other platform.
	const platforms = [...new Set(games.map((g) => g.platform).filter(Boolean))];
	const groups = [
		{ label: 'Play today', items: games.filter((g) => !g.platform) },
		...platforms.map((p) => ({
			label: `${p} Games`,
			items: games.filter((g) => g.platform === p)
		}))
	].filter((g) => g.items.length);

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
	<title>Games · James O'Halloran</title>
	<meta
		name="description"
		content="Daily web games by James O'Halloran — Squigdle, Lawndle, Squishy Billiards, and the ones that found new homes, like Kinda Hard Golf."
	/>
</svelte:head>

<section class="mx-auto max-w-5xl px-6 py-20 sm:py-28">
	<div class="flex items-center gap-3">
		<span class="h-4 w-4 rounded-full bg-frontal ring-[3px] ring-charcoal"></span>
		<span class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">Games</span>
	</div>
	<h1 class="mt-4 text-4xl font-extrabold tracking-tight text-charcoal sm:text-5xl">
		Games I've built
	</h1>
	<p class="mt-4 max-w-2xl text-lg text-charcoal-soft">
		I make small web games (mostly daily games that can be played in a minute).<br/> All free, no download.
	</p>

	{#each groups as group (group.label)}
		<h2 class="mt-14 text-xs font-bold uppercase tracking-widest text-charcoal-soft">
			{group.label}
		</h2>
		<div class="mt-6 grid gap-8 md:grid-cols-2">
			{#each group.items as game (game.slug)}
				<!-- A section with a single game (Steam, so far) would leave a hole
				     beside it on desktop, so a lone card spans both columns and lays
				     out sideways: media left, text right. -->
				{@const wide = group.items.length === 1}
				<!-- The whole card is a plain <article>, not a link: it carries two
				     destinations (the game, the write-up), so making the card itself
				     clickable would leave the real links nested inside it. -->
				<article
					class="group flex flex-col overflow-hidden rounded-cartoon border-[3px] border-charcoal bg-white shadow-cartoon transition-transform duration-300 ease-bouncy hover:-translate-y-1 {wide
						? 'md:col-span-2 md:flex-row'
						: ''}"
				>
					<!-- ── Media. Clip when there is one (played on hover), else the still,
					     else a big lettered tile so a card without art still reads as a
					     card and not as a broken image. -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div
						class="relative border-b-[3px] border-charcoal bg-frontal-soft {wide
							? 'md:flex md:w-2/5 md:shrink-0 md:items-center md:border-b-0 md:border-r-[3px] md:bg-charcoal'
							: ''}"
						on:mouseenter={play}
						on:mouseleave={stop}
					>
						{#if game.video}
							<!-- svelte-ignore a11y-media-has-caption -->
							<video
								src={base + game.video}
								poster={imgSrc(game.image)}
								class="block h-48 w-full bg-charcoal object-contain sm:h-56"
								muted
								loop
								playsinline
								preload="none"
							></video>
						{:else if game.gif}
							<img
								src={base + game.gif}
								alt="{game.title} gameplay"
								class="block h-48 w-full bg-charcoal object-contain sm:h-56"
								loading="lazy"
							/>
						{:else if imgSrc(game.image)}
							<img
								src={imgSrc(game.image)}
								alt={game.title}
								class="block h-48 w-full object-contain sm:h-56"
								style={game.imageBg ? `background:${game.imageBg};` : undefined}
								loading="lazy"
							/>
						{:else}
							<div
								class="flex h-48 w-full items-center justify-center text-6xl font-extrabold text-charcoal/25 sm:h-56"
								aria-hidden="true"
							>
								{game.title.slice(0, 1)}
							</div>
						{/if}

						<!-- Status sits ON the media so the text column below stays one
						     clean column of prose. A sold game gets the same sticker as
						     its panel in the home page's brain, instead of a bare "Sold". -->
						{#if game.status === 'Sold'}
							<span class="sold-ribbon absolute right-3 top-3">Sold to new owners</span>
						{:else}
							<span
								class="absolute right-3 top-3 rounded-full border-[3px] border-charcoal bg-white px-2.5 py-0.5 text-[0.68rem] font-extrabold uppercase tracking-widest text-charcoal shadow-cartoon-sm"
							>
								{game.status}
							</span>
						{/if}
					</div>

					<div class="flex flex-1 flex-col p-6">
						<span class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">
							{game.period}
						</span>
						<h3 class="mt-2 text-2xl font-extrabold leading-snug text-charcoal">
							{game.title}
						</h3>
						<p class="mt-2 text-charcoal-soft">{game.details}</p>
						<p class="mt-3 text-sm leading-relaxed text-charcoal-soft/90">{game.context}</p>

						{#if game.tags?.length}
							<div class="mt-4 flex flex-wrap gap-1.5">
								{#each game.tags as tag}
									<span class="game-tag">{tag}</span>
								{/each}
							</div>
						{/if}

						<!-- Pushed to the bottom so every card's buttons line up across the
						     grid regardless of how long its blurb ran. -->
						<div class="mt-auto flex flex-wrap items-center gap-3 pt-6">
							{#if game.href}
								<a
									href={game.href}
									target={isExternal(game.href) ? '_blank' : undefined}
									rel={isExternal(game.href) ? 'noopener noreferrer' : undefined}
									class="btn-cartoon !bg-frontal !px-4 !py-2 text-sm"
								>
									Play
									<span class="transition-transform group-hover:translate-x-0.5">→</span>
								</a>
							{/if}
							{#if game.post}
								<a
									href="{base}/blog/{game.post}"
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
	{/each}
</section>

<style>
	.game-tag {
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

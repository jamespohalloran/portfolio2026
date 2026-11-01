<!-- /about — fuller bio page: what I've built (the games, compact — /games has
     the full cards), then where I've worked. -->
<script>
	import Seo from '$lib/components/Seo.svelte';
	import { base } from '$app/paths';
	import { games, work } from '$lib/projects';

	const imgSrc = (img) => (img ? (img.startsWith('http') ? img : base + img) : null);
</script>

<Seo title="About · James O'Halloran" description="James O'Halloran — indie game developer and software engineer from Prince Edward Island, making daily web games." card="about" />

<section class="mx-auto max-w-4xl px-6 py-20 sm:py-28">
	<div class="grid gap-10 md:grid-cols-[16rem_1fr] md:items-start">
		<!-- Illustrated portrait, framed in a soft cartoon card. -->
		<div
			class="mx-auto w-56 overflow-hidden rounded-cartoon border-[3px] border-charcoal bg-frontal-soft shadow-cartoon md:mx-0 md:w-full"
		>
			<img
				src="{base}/james-avatar.png"
				alt="Illustrated portrait of James O'Halloran"
				class="mx-auto block aspect-[4/5] w-full object-contain object-bottom p-4"
			/>
		</div>

		<div>
			<span class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">About Me</span>
			<h1 class="mt-3 text-4xl font-extrabold tracking-tight text-charcoal sm:text-5xl">
				Hey, I'm James.
			</h1>
			<div class="mt-6 space-y-4 text-lg leading-relaxed text-charcoal-soft">
				<p>
					I'm a software developer from Prince Edward Island, Canada, and I make small web games.
					I've been in the industry for over 15 years, and I really love building joyful things.
				</p>
				<p>
					These days I'm growing a little collection of daily games:
					<a class="link" href="https://johalloran.dev/squigdle/">Squigdle</a>,
					<a class="link" href="https://johalloran.dev/lawndle/">Lawndle</a> and
					<a class="link" href="https://squishybilliards.com">Squishy Billiards</a>. Before them came
					<a class="link" href="https://kindahardgolf.com">Kinda Hard Golf</a>, which grew to over 4
					million players before I sold it.
				</p>
				<p>
					Most recently I was on the interactives team at
					<a class="link" href="https://brilliant.org">Brilliant</a>, building joyful STEM learning
					experiences, and before that I led web teams at Iron Fox Games and Forestry/TinaCMS.
				</p>
			</div>
			<div class="mt-8 flex flex-wrap gap-3">
				<a href="{base}/games" class="btn-cartoon">Play my games</a>
				<a href="{base}/contact" class="btn-cartoon !bg-temporal">Say hello</a>
			</div>
		</div>
	</div>

	<!-- ── What I've built. The games come first: they're the headline. -->
	<div class="mt-20">
		<span class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">Games</span>
		<h2 class="mt-3 text-3xl font-extrabold tracking-tight text-charcoal">What I've built</h2>
		<div class="mt-8 grid gap-5 sm:grid-cols-2">
			{#each games as game (game.slug)}
				<a
					href={game.href}
					target={game.href?.startsWith('http') ? '_blank' : undefined}
					rel={game.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
					class="group flex flex-col overflow-hidden rounded-cartoon border-[3px] border-charcoal bg-white shadow-cartoon transition-transform duration-300 ease-bouncy hover:-translate-y-1"
				>
					{#if imgSrc(game.image)}
						<img
							src={imgSrc(game.image)}
							alt={game.title}
							class="aspect-[16/9] w-full border-b-[3px] border-charcoal bg-frontal-soft object-cover"
							loading="lazy"
						/>
					{/if}
					<div class="flex flex-1 flex-col p-4">
						<div class="flex flex-wrap items-baseline justify-between gap-x-3">
							<h3 class="text-lg font-extrabold leading-snug text-charcoal">{game.title}</h3>
							<span class="text-[0.7rem] font-bold uppercase tracking-widest text-charcoal-soft">
								{game.status}
							</span>
						</div>
						<p class="mt-1.5 flex-1 text-sm leading-relaxed text-charcoal-soft">{game.details}</p>
						<span class="mt-3 inline-flex items-center gap-1 text-sm font-bold text-charcoal">
							{game.status === 'Sold' ? 'Visit' : 'Play'}
							<span class="transition-transform group-hover:translate-x-1">→</span>
						</span>
					</div>
				</a>
			{/each}
		</div>
	</div>

	<!-- ── Career. Compact on purpose: the games are the headline, and the CV
	     linked below has the long version. -->
	<div class="mt-20">
		<span class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">Career</span>
		<h2 class="mt-3 text-3xl font-extrabold tracking-tight text-charcoal">Where I've worked</h2>
		<div class="mt-8 space-y-5">
			{#each work as job (job.slug)}
				<article
					class="flex gap-4 rounded-cartoon border-[3px] border-charcoal bg-white p-4 shadow-cartoon"
				>
					<div
						class="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border-[3px] border-charcoal bg-frontal-soft"
					>
						{#if job.logo}
							<img
								src="{base}{job.logo}"
								alt={job.title}
								class="h-full w-full object-contain p-1.5"
								loading="lazy"
							/>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-baseline justify-between gap-x-3">
							<h3 class="text-lg font-extrabold leading-snug text-charcoal">
								{#if job.href}
									<a class="link" href={job.href} target="_blank" rel="noopener noreferrer"
										>{job.title}</a
									>
								{:else}
									{job.title}
								{/if}
							</h3>
							<span class="text-[0.7rem] font-bold uppercase tracking-widest text-charcoal-soft">
								{job.period}
							</span>
						</div>
						<span class="text-sm font-bold text-charcoal-soft">{job.role}</span>
						<p class="mt-1.5 text-sm leading-relaxed text-charcoal-soft">{job.details}</p>
					</div>
				</article>
			{/each}
		</div>
		<p class="mt-6 text-sm text-charcoal-soft">
			Want the long version?
			<a class="link" href="{base}/James_OHalloran_Software_Engineer.pdf" download>Download my CV</a>.
		</p>
	</div>
</section>

<style>
	.link {
		font-weight: 700;
		color: var(--color-charcoal);
		text-decoration: underline;
		text-decoration-thickness: 2px;
		text-underline-offset: 3px;
		text-decoration-color: var(--color-frontal);
	}
	.link:hover {
		text-decoration-color: var(--color-charcoal);
	}
</style>

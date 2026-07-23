<!-- /about — fuller bio page. -->
<script>
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>About · James O'Halloran</title>
	<meta
		name="description"
		content="James O'Halloran — software developer from Prince Edward Island who ships games and web tools."
	/>
</svelte:head>

<section class="mx-auto max-w-4xl px-6 py-20 sm:py-28">
	<div class="grid gap-10 md:grid-cols-[16rem_1fr] md:items-start">
		<!-- Illustrated portrait, framed in a soft cartoon card. -->
		<div
			class="mx-auto w-56 overflow-hidden rounded-cartoon border-[3px] border-charcoal bg-frontal-soft shadow-cartoon md:mx-0 md:w-full"
		>
			<img
				src="{base}/james-avatar.svg"
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
					I'm a software developer from Prince Edward Island, Canada. I've been in the industry for
					over 15 years. I really love building joyful products.
				</p>
				<p>
					Most recently I built some daily games that have been played by millions of players:
					<a class="link" href="https://kindahardgolf.com">Kinda Hard Golf</a> (recenty acquired)
					and
					<a class="link" href="https://squishybilliards.com">Squishy Billiards</a>. Before that I
					worked at Forestry/TinaCMS bridging the gap between well-engineered
					websites and content-creation for non-developers.
				</p>
				<p>
					My recent full-time role was with <a class="link" href="https://brilliant.org">Brilliant</a>, where I worked with the interactives team building joyful Stem learning experiences.
				</p>
			</div>
			<div class="mt-8 flex flex-wrap gap-3">
				<a href="/#projects" class="btn-cartoon">See my projects</a>
				<a href="{base}/James_OHalloran_Software_Engineer.pdf" download class="btn-cartoon !bg-temporal">Download CV</a>
			</div>
		</div>
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

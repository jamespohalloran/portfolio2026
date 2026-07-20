<script>
	// Resolves static assets correctly under any deploy base path ('' by default).
	import { base } from '$app/paths';
	import { posts } from '$lib/posts';
	import { formatDate } from '$lib/formatDate';
	import ContactSection from '$lib/components/ContactSection.svelte';

	// ─────────────────────────────────────────────────────────────────────
	//  HOME — "Scroll to zoom into James's brain", then keep scrolling.
	//
	//   • Intro (pinned): a tall wrapper whose inner layer is `sticky`. The
	//     dishes hero and the brain overlay share the SAME box, the SAME
	//     object-cover fit, and the SAME zoom transform — so the brain
	//     (brain_with-bg.svg, drawn over the head on the hero's exact canvas)
	//     is pixel-locked to the head and simply fades + grows in on scroll.
	//   • About Me · Recent posts · Contact — normal-flow sections after the pin.
	// ─────────────────────────────────────────────────────────────────────

	// Three most-recent posts for the home "From the blog" strip.
	const recentPosts = posts.slice(0, 3);

	// --- Scroll transition state -----------------------------------------
	let scrollY = 0;
	let innerHeight = 1;

	// `reveal` (0→1 over the first half-viewport of scroll) drives the whole
	// zoom: the hero fades out, the brain fades + grows in, locked to the head.
	$: reveal = Math.min(Math.max(scrollY / (innerHeight * 0.5), 0), 1);

	// The single shared zoom. BOTH the hero and the brain apply this exact
	// transform (same scale, same origin) — that's what keeps the brain locked
	// to the head as everything zooms in.
	$: dishScale = 1 + reveal * 0.6;
	$: dishOpacity = 1 - reveal;
	$: brainOpacity = reveal;
	$: hookInteractive = reveal < 0.5;
	$: brainInteractive = reveal >= 0.5;

	// Shared zoom focal point (the head), as a % of the viewport. The hero and
	// the brain MUST use the same value.
	const ORIGIN = '61% 43%';
</script>

<!-- Bind scroll + viewport size so the transition can be math-driven. -->
<svelte:window bind:scrollY bind:innerHeight />

<!-- ═══════════════════════════════════════════════════════════════════
     INTRO — pinned scroll-zoom.
     ═══════════════════════════════════════════════════════════════════ -->
<div class="relative bg-parchment" style="height: 250vh;">
	<div class="sticky top-0 h-screen overflow-hidden">
		<!-- ── The Mundane Hook (scales + fades on scroll) ── -->
		<div
			class="absolute inset-0 z-10 overflow-hidden transition-none {hookInteractive
				? ''
				: 'pointer-events-none'}"
			style="opacity: {dishOpacity}; transform: scale({dishScale}); transform-origin: {ORIGIN};"
			aria-hidden={!hookInteractive}
		>
			<img
				src="{base}/portfolio-hero.png"
				alt="James in a ball cap washing dishes in a pastel cartoon kitchen"
				class="h-full w-full object-cover object-center"
				fetchpriority="high"
			/>

			<div
				class="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 bg-gradient-to-t from-cream via-cream/70 to-transparent px-6 pb-10 pt-28 text-center"
			>
				<p class="max-w-md text-2xl font-extrabold leading-tight text-charcoal sm:text-3xl">
					Scroll to zoom into James's brain.
				</p>
				<span class="animate-bounce text-3xl" aria-hidden="true">↓</span>
			</div>
		</div>

		<!-- ── The Brain overlay ────────────────────────────────────────
		     Same element type + object-fit + coordinate canvas as the hero,
		     and the same zoom transform → guaranteed pixel-alignment with the
		     head. Fades + grows in as you scroll. -->
		<div
			class="absolute inset-0 z-20 transition-none {brainInteractive ? '' : 'pointer-events-none'}"
			style="opacity: {brainOpacity}; transform: scale({dishScale}); transform-origin: {ORIGIN};"
			aria-hidden={!brainInteractive}
		>
			<img
				src="{base}/brain_with-bg.svg"
				alt=""
				class="h-full w-full select-none object-cover object-center"
			/>
		</div>
	</div>
</div>

<!-- ═══════════════════════════════════════════════════════════════════
     ABOUT ME
     ═══════════════════════════════════════════════════════════════════ -->
<section id="about" class="mx-auto max-w-4xl px-6 py-24">
	<div class="grid gap-10 md:grid-cols-[16rem_1fr] md:items-center">
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
			<h2 class="mt-3 text-4xl font-extrabold tracking-tight text-charcoal sm:text-5xl">
				Hey, I'm James.
			</h2>
			<p class="mt-5 text-lg leading-relaxed text-charcoal-soft">
				I'm a software developer from Prince Edward Island who can't stop starting projects. Most
				recently I built and sold two daily games — Kinda Hard Golf and Squishy Billiards — and
				before that I spent years on developer tooling and content platforms. I like shipping
				strange little things and writing about what I learn.
			</p>
			<a href="/about" class="btn-cartoon mt-7">More about me →</a>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════════════════════════════
     RECENT POSTS
     ═══════════════════════════════════════════════════════════════════ -->
<section class="mx-auto max-w-5xl px-6 py-16">
	<div class="flex items-end justify-between gap-4">
		<div>
			<span class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">
				From the blog
			</span>
			<h2 class="mt-2 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
				Recent posts
			</h2>
		</div>
		<a
			href="/blog"
			class="hidden shrink-0 font-bold text-charcoal underline decoration-frontal decoration-2 underline-offset-4 hover:decoration-charcoal sm:inline"
		>
			All posts →
		</a>
	</div>

	<div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each recentPosts as post (post.slug)}
			<a
				href="/blog/{post.slug}"
				class="group flex flex-col rounded-cartoon border-[3px] border-charcoal bg-white p-5 shadow-cartoon transition-transform duration-300 ease-bouncy hover:-translate-y-1"
			>
				<time datetime={post.date} class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">
					{formatDate(post.date)}
				</time>
				<h3 class="mt-2 text-xl font-extrabold leading-snug text-charcoal">{post.title}</h3>
				<p class="mt-2 flex-1 text-sm text-charcoal-soft">{post.description}</p>
				<span class="mt-4 inline-flex items-center gap-1 text-sm font-bold text-charcoal">
					Read <span class="transition-transform group-hover:translate-x-1">→</span>
				</span>
			</a>
		{/each}
	</div>

	<a href="/blog" class="btn-cartoon mt-8 sm:hidden">All posts →</a>
</section>

<!-- ═══════════════════════════════════════════════════════════════════
     CONTACT
     ═══════════════════════════════════════════════════════════════════ -->
<ContactSection />

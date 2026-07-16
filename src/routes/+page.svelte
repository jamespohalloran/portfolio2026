<script>
	// ─────────────────────────────────────────────────────────────────────
	//  HOME — "Scroll to zoom into James's brain"
	//
	//  Two stacked experiences driven by one scroll position:
	//   1. The Mundane Hook  — a fixed kitchen/dishes scene that scales up and
	//      fades out as you scroll the first viewport.
	//   2. The Brain Dashboard — an interactive SVG brain. Hovering a lobe
	//      highlights it and swaps in a preview card linking to that section.
	// ─────────────────────────────────────────────────────────────────────

	// Resolves static assets correctly under any deploy base path ('' by default).
	import { base } from '$app/paths';

	// --- Scroll transition state -----------------------------------------
	// Bound to the window below. innerHeight defaults to 1 to avoid a divide
	// by zero before the browser reports real dimensions.
	let scrollY = 0;
	let innerHeight = 1;

	// 0 → 1 as the user scrolls through the first viewport.
	$: progress = Math.min(Math.max(scrollY / innerHeight, 0), 1);

	// Dishes scene: zoom in + fade out. Brain: fade/lock in.
	$: dishScale = 1 + progress * 0.6;
	$: dishOpacity = 1 - progress;
	$: brainOpacity = progress;
	// Once mostly zoomed in, let clicks fall through to the brain below.
	$: hookInteractive = progress < 0.5;

	// --- Interactive brain state -----------------------------------------
	// Which lobe is currently hovered: 'frontal' | 'cerebellum' | 'temporal' | null
	let hovered = null;

	// Single source of truth for each lobe: color, target route, preview copy.
	const lobes = {
		frontal: {
			label: 'Frontal Lobe',
			role: 'Projects',
			title: 'Squishy Billiards',
			blurb: 'Solo-built game — sold the IP after it reached millions of players.',
			href: '/projects',
			accent: 'bg-frontal',
			ring: 'text-frontal'
		},
		cerebellum: {
			label: 'Cerebellum',
			role: 'Experience',
			title: 'Brilliant.org',
			blurb: 'Massive, scalable CMS architecture for interactive learning.',
			href: '/experience',
			accent: 'bg-cerebellum',
			ring: 'text-cerebellum'
		},
		temporal: {
			label: 'Temporal Lobe',
			role: 'Blog',
			title: 'Physics Optimization',
			blurb: 'Tech thoughts on games, the web, and where they overlap.',
			href: '/blog',
			accent: 'bg-temporal',
			ring: 'text-temporal'
		}
	};

	// Reactive reference to the currently-previewed lobe (or null).
	$: active = hovered ? lobes[hovered] : null;
</script>

<!-- Bind scroll + viewport size so the transition can be math-driven. -->
<svelte:window bind:scrollY bind:innerHeight />

<!-- ═══════════════════════════════════════════════════════════════════
     SECTION 1 — The Mundane Hook (fixed, scales + fades on scroll)
     ═══════════════════════════════════════════════════════════════════ -->
<div
	class="fixed inset-0 z-10 overflow-hidden transition-none {hookInteractive
		? ''
		: 'pointer-events-none'}"
	style="opacity: {dishOpacity}; transform: scale({dishScale}); transform-origin: 50% 42%;"
	aria-hidden={!hookInteractive}
>
	<!-- The mundane hook: James doing the dishes. The whole scene is what the
	     scroll zoom pushes into — transform-origin above is set on his head so
	     it reads as "zooming into his brain". -->
	<img
		src="{base}/portfolio-hero.png"
		alt="James in a ball cap washing dishes in a pastel cartoon kitchen"
		class="h-full w-full object-cover object-center"
		fetchpriority="high"
	/>

	<!-- Prompt over a soft cream scrim so the text stays legible on the art. -->
	<div
		class="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 bg-gradient-to-t from-cream via-cream/70 to-transparent px-6 pb-10 pt-28 text-center"
	>
		<p class="max-w-md text-2xl font-extrabold leading-tight text-charcoal sm:text-3xl">
			Scroll to zoom into James's brain.
		</p>
		<span class="animate-bounce text-3xl" aria-hidden="true">↓</span>
	</div>
</div>

<!-- Spacer: gives the fixed hook a full viewport of scroll to transition over. -->
<section class="h-screen" aria-hidden="true"></section>

<!-- ═══════════════════════════════════════════════════════════════════
     SECTION 2 — The Interactive Brain Dashboard (fades / locks in)
     ═══════════════════════════════════════════════════════════════════ -->
<section
	class="relative z-20 flex min-h-screen items-center transition-opacity duration-500 ease-bouncy"
	style="opacity: {brainOpacity};"
>
	<div
		class="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-[1.3fr_1fr]"
	>
		<!-- ── The brain ────────────────────────────────────────────────
		     Three semantic path groups, each an <a> wrapping its <path>.
		     NOTE: path geometry is intentionally simple/organic — refine the
		     `d` attributes to your final brain art without touching the logic. -->
		<div class="relative">
			<svg
				viewBox="0 0 400 320"
				class="mx-auto w-full max-w-xl select-none overflow-visible"
				role="group"
				aria-label="James's brain — hover a lobe to preview that section"
			>
				<!-- Frontal Lobe → Projects (violet) -->
				<a href="/projects" aria-label="Projects — Frontal Lobe">
					<path
						id="frontal-lobe"
						d="M60,150 C40,90 90,48 150,55 C205,45 245,72 236,122 C242,162 200,188 150,182 C100,192 70,182 60,150 Z"
						class="origin-center cursor-pointer fill-frontal stroke-charcoal transition-all duration-300 ease-bouncy
							{hovered === 'frontal' ? 'scale-105 opacity-100' : hovered ? 'opacity-50' : 'opacity-90'}"
						stroke-width="6"
						stroke-linejoin="round"
						on:mouseenter={() => (hovered = 'frontal')}
						on:mouseleave={() => (hovered = null)}
						on:focus={() => (hovered = 'frontal')}
						on:blur={() => (hovered = null)}
					/>
				</a>

				<!-- Cerebellum → Experience (coral) -->
				<a href="/experience" aria-label="Experience — Cerebellum">
					<path
						id="cerebellum"
						d="M236,150 C282,120 342,130 352,176 C362,216 322,248 276,236 C240,242 220,210 231,180 C229,168 231,158 236,150 Z"
						class="origin-center cursor-pointer fill-cerebellum stroke-charcoal transition-all duration-300 ease-bouncy
							{hovered === 'cerebellum' ? 'scale-105 opacity-100' : hovered ? 'opacity-50' : 'opacity-90'}"
						stroke-width="6"
						stroke-linejoin="round"
						on:mouseenter={() => (hovered = 'cerebellum')}
						on:mouseleave={() => (hovered = null)}
						on:focus={() => (hovered = 'cerebellum')}
						on:blur={() => (hovered = null)}
					/>
				</a>

				<!-- Temporal Lobe → Blog (mint) -->
				<a href="/blog" aria-label="Blog — Temporal Lobe">
					<path
						id="temporal-lobe"
						d="M92,182 C86,222 120,258 168,252 C210,258 230,226 218,194 C192,206 150,206 120,196 C108,192 98,186 92,182 Z"
						class="origin-center cursor-pointer fill-temporal stroke-charcoal transition-all duration-300 ease-bouncy
							{hovered === 'temporal' ? 'scale-105 opacity-100' : hovered ? 'opacity-50' : 'opacity-90'}"
						stroke-width="6"
						stroke-linejoin="round"
						on:mouseenter={() => (hovered = 'temporal')}
						on:mouseleave={() => (hovered = null)}
						on:focus={() => (hovered = 'temporal')}
						on:blur={() => (hovered = null)}
					/>
				</a>
			</svg>
		</div>

		<!-- ── Reactive preview card ────────────────────────────────────
		     Shows the hovered lobe's preview, or a resting prompt otherwise. -->
		<aside class="lg:min-h-[16rem]">
			{#if active}
				<a
					href={active.href}
					class="block rounded-cartoon border-[3px] border-charcoal bg-white p-6 shadow-cartoon transition-transform duration-300 ease-bouncy hover:-translate-y-1"
				>
					<div class="mb-3 flex items-center gap-3">
						<span class="h-4 w-4 rounded-full {active.accent} ring-[3px] ring-charcoal"></span>
						<span class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">
							{active.label} · {active.role}
						</span>
					</div>
					<h2 class="text-2xl font-extrabold text-charcoal">{active.title}</h2>
					<p class="mt-2 text-charcoal-soft">{active.blurb}</p>
					<span class="mt-4 inline-flex items-center gap-1 font-bold text-charcoal">
						Explore {active.role} →
					</span>
				</a>
			{:else}
				<div
					class="rounded-cartoon border-[3px] border-dashed border-charcoal/40 p-6 text-charcoal-soft"
				>
					<h2 class="text-2xl font-extrabold text-charcoal">Poke around the brain.</h2>
					<p class="mt-2">
						Hover a lobe to preview my Projects, Experience, or Blog — then click to dive in.
					</p>
				</div>
			{/if}
		</aside>
	</div>
</section>

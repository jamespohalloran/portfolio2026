<script>
	// Resolves static assets correctly under any deploy base path ('' by default).
	import { base } from '$app/paths';
	import { onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { posts } from '$lib/posts';
	import { formatDate } from '$lib/formatDate';
	import ContactSection from '$lib/components/ContactSection.svelte';

	// ─────────────────────────────────────────────────────────────────────
	//  HOME — "Scroll to zoom into James's brain", then browse the segments.
	//
	//   • Intro (pinned): the dishes hero and the inline brain (brain_with-bg.svg
	//     — drawn over the head on the hero's exact 4914×3981 canvas) share the
	//     SAME box, SAME object-cover fit, and SAME zoom transform, so the brain
	//     is pixel-locked to the head. It fades + grows in as you scroll.
	//   • Once zoomed, the brain stays pinned while you keep scrolling: scroll
	//     walks through the REGIONS (auto-selecting each), snapping to one at a
	//     time. Clicking a segment jumps to that region. The brain then parks
	//     itself in the top-right corner and that region's items are listed as
	//     a vertical ACCORDION — regions move horizontally, items vertically.
	//     Nothing navigates away — the links inside an expanded item are the
	//     only way out.
	//   • About Me · Recent posts · Contact — normal-flow sections after the pin.
	//
	//  NOTE: do NOT put `transform-box`/`transform-origin` on the segment <g>s —
	//  they carry the art's matrix() positioning transform, and those CSS props
	//  reinterpret its origin and fling the segments off-screen.
	// ─────────────────────────────────────────────────────────────────────

	const recentPosts = posts.slice(0, 3);

	// The three brain segments, keyed by SVG group id: accent color (matching
	// the art), label, and the list of items the context pane cycles through.
	// `href` on an item is optional — external links open in a new tab, internal
	// ones navigate; the item card is only a link when it has one.
	const sections = {
		big: {
			label: 'Projects',
			color: '#a8e6cf',
			items: [
				{
					title: 'Kinda Hard Golf',
					details:
						'A daily golf game I built solo in PixiJS over a few weeks. It struck a chord — reaching over 10,000 players — and after shipping 400 daily levels I sold the IP to a team of daily-game veterans.',
					tags: ['10k+ players', 'Sold the IP', 'Solo-built'],
					href: 'https://kindahardgolf.com',
					image: 'https://kindahardgolf.com/hero.jpg'
				},
				{
					title: 'Squishy Billiards',
					details:
						'Pool, with a gooey chaotic twist and fresh daily levels. A physics playground I built to see if lightning could strike twice.',
					tags: ['Daily levels', 'Physics toy'],
					href: 'https://squishybilliards.com',
					image: 'https://squishybilliards.com/hero.jpg'
				},
				{
					title: 'Miner Meltdown',
					details:
						'A multiplayer sabotage/mining game I built solo and shipped on Steam over several years — later selling the IP.',
					tags: ['Steam', 'Multiplayer', 'Sold the IP'],
					href: 'https://store.steampowered.com/app/426190/Miner_Meltdown/',
					image: null // TODO: drop a screenshot in /static/projects and set the path
				},
				{
					title: 'DraftOrders.com',
					details:
						'A quirky little tool that generates fantasy draft orders with some pizzazz. Built with Next.js, TypeScript & MobX.',
					tags: ['Next.js', 'MobX'],
					href: 'https://draftorders.com',
					image: '/posts/introducing-draftorders/screenshot.png'
				}
			]
		},
		middle: {
			label: 'Experience',
			color: '#ffb59e',
			items: [
				{
					title: 'Brilliant.org',
					details:
						'Architected a massive, scalable CMS powering Brilliant’s interactive learning content.',
					tags: ['CMS', 'Scale']
				},
				{
					title: 'Forestry.io / TinaCMS',
					details:
						'Built developer tooling bridging fast, well-engineered sites and content editing that non-developers can actually use.',
					tags: ['DevTools', 'Open source']
				}
			]
		},
		bottom: {
			label: 'Writing',
			color: '#fceab1',
			items: recentPosts.map((p) => ({
				title: p.title,
				details: p.description,
				href: `/blog/${p.slug}`
			}))
		}
	};
	// --- Scroll transition state -----------------------------------------
	let scrollY = 0;
	let innerHeight = 1;
	let innerWidth = 0;

	// Viewports scrolled. The intro is pinned (sticky layer below) long enough
	// to zoom in and then dwell, so you can click the brain.
	$: t = scrollY / innerHeight;

	// ZOOM controls how big the hero + brain get at the end of the zoom-in. Kept
	// modest because the brain doesn't stay big — it immediately shrinks away to
	// its parked corner, so a huge zoom only made that a longer fall.
	const ZOOM = 0.5; // final scale = 1 + ZOOM = 1.5×
	// Viewports of scroll the zoom-in takes. Kept short so you're never parked
	// on a big bare brain with nothing to read — the region pane starts settling
	// in the instant the zoom lands.
	const ZOOM_END = 0.4;
	// Shared zoom focal point (the head). Hero + brain MUST match.
	const ORIGIN = '61% 43%';

	$: reveal = Math.min(Math.max(t / ZOOM_END, 0), 1); // 0→1 over the zoom
	$: dishScale = 1 + reveal * ZOOM;
	$: dishOpacity = 1 - reveal;
	$: brainOpacity = reveal;
	$: hookInteractive = reveal < 0.5;
	$: brainInteractive = reveal >= 0.5;

	// --- Scroll-driven region browse -------------------------------------
	// Scrolling walks through the REGIONS (segments) only. The items within a
	// region are NOT scroll-driven — you expand them in the accordion.
	const order = ['big', 'middle', 'bottom'];
	$: totalRegions = order.length;

	// Viewports of scroll per region. Half a viewport is about one comfortable
	// flick, so each flick lands on the next region — and `scroll-snap-stop`
	// below guarantees it can't overshoot into the one after. The pin height
	// (introVH) is derived from this.
	const PER_REGION = 0.5;
	$: dwell = Math.max(totalRegions * PER_REGION, 0.5);
	$: introVH = Math.round((1 + ZOOM_END + dwell) * 100);

	// Scroll-snap beats: the hero (t=0), then one per region (centered in its
	// slice, brain settled). There is deliberately NO beat at the end of the
	// zoom — you should never come to rest on a bare, contentless brain.
	$: snapTs = [
		0,
		...Array.from({ length: totalRegions }, (_, k) => ZOOM_END + ((k + 0.5) / totalRegions) * dwell)
	];

	// Progress through the dwell (after the zoom completes) → region.
	$: browse = Math.min(Math.max((t - ZOOM_END) / dwell, 0), 1);
	$: regionIndex = totalRegions ? Math.min(Math.floor(browse * totalRegions), totalRegions - 1) : 0;
	$: active = brainInteractive ? order[regionIndex] : null;

	// As browsing begins the brain shrinks and flies to its parked position in
	// the top-right corner, clearing the screen for the (info-rich) featured
	// card. `settle` ramps 0→1 over the first slice of the browse; the pane
	// fades in with it.
	const SETTLE_FRAC = 0.07; // fraction of the browse spent settling
	$: isNarrow = innerWidth > 0 && innerWidth < 768;
	$: settle = Math.min(Math.max(browse / SETTLE_FRAC, 0), 1);

	// --- Where the brain parks -------------------------------------------
	// Once settled the brain tucks into the TOP-RIGHT corner, fully clear of the
	// fixed header, leaving the rest of the screen to the cards. A hand-tuned
	// translate/scale can't do that reliably: the SVG is `slice`-fitted, so the
	// brain's on-screen position and size depend on the viewport's aspect ratio.
	// So we solve for the transform instead.
	//
	// BRAIN_* is the brain art's bounding box inside the 4914×3981 hero canvas,
	// measured from the three segment outlines (plus half a stroke of slack).
	const CANVAS_W = 4914;
	const CANVAS_H = 3981;
	const BRAIN_X = 2295;
	const BRAIN_Y = 1350;
	const BRAIN_W = 871;
	const BRAIN_H = 656;
	const HEADER_H = 68; // fixed overlay header
	const PARK_GAP = 14; // breathing room below the header and off the right edge

	// `object-cover` fit of the canvas into the viewport.
	$: cover = Math.max(innerWidth / CANVAS_W, innerHeight / CANVAS_H);
	$: artX = (innerWidth - CANVAS_W * cover) / 2;
	$: artY = (innerHeight - CANVAS_H * cover) / 2;
	// The brain's untransformed box, in viewport pixels.
	$: brainW = BRAIN_W * cover;
	$: brainH = BRAIN_H * cover;
	$: brainCx = artX + (BRAIN_X + BRAIN_W / 2) * cover;
	$: brainCy = artY + (BRAIN_Y + BRAIN_H / 2) * cover;

	// Parked size, expressed as a share of the viewport width so it reads the
	// same on any screen.
	$: parkScale = brainW ? (innerWidth * (isNarrow ? 0.3 : 0.24)) / brainW : 1;
	$: parkCx = innerWidth - PARK_GAP - (brainW * parkScale) / 2;
	$: parkCy = HEADER_H + PARK_GAP + (brainH * parkScale) / 2;
	// ORIGIN ('61% 43%') as pixels — the layer box is the viewport. Scaling about
	// it leaves that point fixed, so the translate we need is just the gap
	// between where the centre lands after scaling and where we want it.
	$: parkTx = parkCx - (innerWidth * 0.61 + parkScale * (brainCx - innerWidth * 0.61));
	$: parkTy = parkCy - (innerHeight * 0.43 + parkScale * (brainCy - innerHeight * 0.43));

	// `settle` is derived straight from scrollY, and the whole settle plays out
	// over ~0.17 viewports — so on a phone (coarse, throttled scroll sampling,
	// plus the snap/dead-zone scrolls covering that distance in a few frames)
	// the brain would arrive in two or three big steps: the jerk. Easing a
	// SMOOTHED copy toward the target each frame decouples the animation from
	// how finely the browser happens to report scroll. The zoom itself still
	// tracks raw scroll 1:1 (via dishScale) — only the settle pose is damped.
	let settleSmooth = 0;
	let easeRaf = 0;
	$: ease(settle);
	function ease(target) {
		if (typeof window === 'undefined') {
			settleSmooth = target;
			return;
		}
		cancelAnimationFrame(easeRaf);
		const step = () => {
			const d = target - settleSmooth;
			if (Math.abs(d) < 0.002) {
				settleSmooth = target;
				return;
			}
			settleSmooth += d * 0.13;
			easeRaf = requestAnimationFrame(step);
		};
		easeRaf = requestAnimationFrame(step);
	}

	$: brainScale = dishScale + settleSmooth * (parkScale - dishScale);
	$: brainTx = settleSmooth * parkTx;
	$: brainTy = settleSmooth * parkTy;
	$: paneOpacity = active ? settleSmooth : 0;

	$: items = active ? sections[active].items : [];

	// Items are a plain vertical ACCORDION inside the region's container: one
	// open at a time (so the container's height stays bounded and predictable),
	// and the first is open by default so a region never reads as empty.
	// Regions move horizontally, items move vertically — one axis, one meaning.
	let openIndex = 0;
	$: active, (openIndex = 0); // new region → back to its first item

	// Which way the region container should slide. Going forward the outgoing
	// one leaves to the left and the new one enters from the right; going back,
	// the mirror. Without this the animation would read the same in both
	// directions and stop meaning anything.
	let slideDir = 1;
	let prevRegion = 0;
	$: if (regionIndex !== prevRegion) {
		slideDir = regionIndex > prevRegion ? 1 : -1;
		prevRegion = regionIndex;
	}
	function toggleItem(i) {
		openIndex = openIndex === i ? -1 : i;
	}

	onDestroy(() => {
		clearTimeout(idleTimer);
		// onDestroy also runs during SSR, where rAF doesn't exist.
		if (typeof window !== 'undefined') cancelAnimationFrame(easeRaf);
	});

	// --- Scroll-idle guards ----------------------------------------------
	// Two invariants enforced once scrolling has actually STOPPED (debounced, so
	// momentum and the corrective scrolls themselves don't retrigger them):
	//
	//   1. You never come to rest mid-zoom, on a huge contentless brain. The
	//      stretch between the hero beat and the first region is most of a
	//      viewport of pure zoom with nothing to read.
	//   2. One gesture never carries you through more than one beat. Mandatory
	//      snapping + `scroll-snap-stop: always` is supposed to guarantee this,
	//      but a hard fling from the very top can still clear the first region
	//      in some browsers — so this backstops it.
	//
	// "Beats" are the snap targets in order: hero, each region, then the exit.
	// Deliberate jumps (clicking a lobe, a chip, an arrow, the skip pill) set
	// `bypassGuard` — those are *meant* to cross several beats at once.
	$: beatTs = snapTs;
	$: beatIndex = t > mandatoryEnd ? -1 : nearestBeat(t);
	function nearestBeat(pos) {
		let best = 0;
		for (let i = 1; i < beatTs.length; i++) {
			if (Math.abs(beatTs[i] - pos) < Math.abs(beatTs[best] - pos)) best = i;
		}
		return best;
	}

	let idleTimer;
	// null = "not established yet" — the first idle just records where we are.
	// That's what makes a deep link like /#writing work: the browser's native
	// anchor jump lands several beats in, and must not be walked back.
	let restBeat = null;
	let bypassGuard = false;
	$: t, innerHeight, queueIdleCheck();
	function queueIdleCheck() {
		if (typeof window === 'undefined') return;
		clearTimeout(idleTimer);
		idleTimer = setTimeout(onScrollIdle, 180);
	}
	function scrollToBeat(k) {
		// Our own correction is a deliberate jump too — without this the landing
		// gets re-measured and can bounce back, which is the other half of the
		// flicker.
		bypassGuard = true;
		window.scrollTo({ top: beatTs[k] * innerHeight, behavior: 'smooth' });
	}
	function onScrollIdle() {
		// Outside the pin entirely — nothing to police, and re-entering from
		// below should count as a fresh gesture.
		if (beatIndex < 0) {
			restBeat = -1;
			bypassGuard = false;
			return;
		}
		if (bypassGuard) {
			bypassGuard = false;
			restBeat = beatIndex;
			return;
		}

		// (1) Parked mid-zoom → continue to whichever end is nearer.
		const paneIn = ZOOM_END + SETTLE_FRAC * dwell;
		if (t > 0.04 && t < paneIn) {
			scrollToBeat(t < ZOOM_END * 0.3 ? 0 : 1);
			return;
		}

		// (2) Overshot by more than one beat → walk it back to exactly one.
		// `restBeat` is left alone so the next idle re-checks the corrected spot.
		// (`null >= 0` is true in JS, so test for null explicitly.)
		if (restBeat !== null && restBeat >= 0 && Math.abs(beatIndex - restBeat) > 1) {
			scrollToBeat(restBeat + Math.sign(beatIndex - restBeat));
			return;
		}
		restBeat = beatIndex;
	}

	// --- Snap mode --------------------------------------------------------
	// One swipe should never carry you through more than one region. That's what
	// `scroll-snap-stop: always` is for, but browsers only honour it reliably
	// under MANDATORY snapping — with `proximity` a hard fling sails straight
	// past. So we run mandatory across the regions and drop back to proximity
	// for the tail of the pin and everything after it: the About/posts/contact
	// sections have no snap points, and mandatory there fights you the whole way
	// down. Ending the mandatory window just past the LAST region beat is what
	// makes leaving the brain section feel like a normal scroll again.
	$: mandatoryEnd = snapTs[snapTs.length - 1] + 0.15;

	let snapSuspended = false;
	let snapModeNow = '';
	$: applySnapMode(t < mandatoryEnd, snapSuspended);
	function applySnapMode(inRegions, suspended) {
		if (typeof document === 'undefined') return;
		const want = suspended ? 'none' : inRegions ? 'y mandatory' : 'y proximity';
		// CRITICAL: this runs on every scroll frame. Re-assigning the property
		// mid-gesture makes the browser re-evaluate snapping, which reads as the
		// region flickering and as the page resisting your swipe. Only ever write
		// on an actual change.
		if (want === snapModeNow) return;
		snapModeNow = want;
		document.documentElement.style.scrollSnapType = want;
	}

	// Skip past the whole pinned brain section straight to About. Snap is
	// suspended for the duration so the region `scroll-snap-stop`s don't catch
	// the jump partway, then restored once the smooth scroll settles.
	function skipIntro() {
		const el = document.getElementById('about');
		if (!el) return;
		bypassGuard = true;
		snapSuspended = true;
		el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		const restore = () => {
			snapSuspended = false;
			window.removeEventListener('scrollend', restore);
		};
		window.addEventListener('scrollend', restore);
		setTimeout(restore, 1600); // fallback for browsers without `scrollend`
	}

	// Emphasis for a segment: the active one pops, the others dim; before the
	// zoom finishes they idle-pulse to invite a click.
	const segClass = (key, a) => (a === key ? 'is-active' : a ? 'is-dim' : 'is-idle');

	// Clicking a segment jumps the scroll straight to that region's slice.
	function goToRegion(key, behavior = 'smooth') {
		const k = order.indexOf(key);
		if (k < 0) return;
		bypassGuard = true; // an explicit jump may legitimately cross several beats
		const b = (k + 0.5) / totalRegions;
		window.scrollTo({ top: (ZOOM_END + b * dwell) * innerHeight, behavior });
	}

	// Move one region forward/back (wraps). This is what the mobile section bar's
	// ‹ › arrows drive — on a phone there's no filmstrip to imply "there's more
	// over here", so the regions need an explicit control, not just scroll.
	// The regions are a LINE, not a loop: going forward off the end continues to
	// About (the section that follows the pin), and going back off the front
	// returns to the hero. Wrapping around would strand you in the pinned
	// section with no way out but the skip pill.
	$: atLastRegion = regionIndex >= totalRegions - 1;
	function stepRegion(dir) {
		const k = regionIndex + dir;
		if (k >= totalRegions) return skipIntro();
		if (k < 0) {
			bypassGuard = true;
			return window.scrollTo({ top: 0, behavior: 'smooth' });
		}
		goToRegion(order[k]);
	}

	// Each region also gets a real anchor element parked at its scroll beat (see
	// `.region-anchor` below), so /#projects — the header's Projects link — drops
	// you straight onto the Projects region of the brain, no JS required.
	const REGION_ID = { big: 'projects', middle: 'experience', bottom: 'writing' };
	function onKey(event, key) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			goToRegion(key);
		}
	}

	const isExternal = (href) => !!href?.startsWith('http');
	const imgSrc = (img) => (img ? (img.startsWith('http') ? img : base + img) : null);
</script>

<!-- Bind scroll + viewport size so the transition can be math-driven. -->
<svelte:window bind:scrollY bind:innerHeight bind:innerWidth />

<!-- ═══════════════════════════════════════════════════════════════════
     INTRO — pinned scroll-zoom + segment browse.
     ═══════════════════════════════════════════════════════════════════ -->
<div class="relative bg-parchment" style="height: {introVH}vh;">
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

		<!-- ── The Brain (inline brain_with-bg.svg) ─────────────────────
		     Same box, same object-cover fit (slice + hero aspect) and the same
		     zoom transform as the hero → locked to the head. Each <g> segment
		     is a click target: idle segments pulse to invite a click; the
		     selected one pops while the others dim. -->
		<div
			class="absolute inset-0 z-20 transition-none {brainInteractive ? '' : 'pointer-events-none'}"
			style="opacity: {brainOpacity}; transform: translate({brainTx}px, {brainTy}px) scale({brainScale}); transform-origin: {ORIGIN};"
			aria-hidden={!brainInteractive}
		>
			<svg
				viewBox="0 0 4914 3981"
				preserveAspectRatio="xMidYMid slice"
				class="h-full w-full select-none"
				style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"
			>
				<g id="Brain">
					<!-- ── BOTTOM → Writing (yellow) ─────────────────────── -->
					<g
						class="brain-seg {segClass('bottom', active)}"
						transform="matrix(0.237131,0,0,0.237131,2069.084103,1202.395851)"
						role="button"
						tabindex="0"
						aria-label="Show Writing"
						on:click={() => goToRegion('bottom')}
						on:keydown={(e) => onKey(e, 'bottom')}
					>
						<path
							d="M2593.346,2682.147C2594.775,2720.02 2627.413,2915.037 2909.232,2902.004C2905.615,2906.441 2884.338,2924.401 2897.43,2944.334C2944.206,3015.552 3184.955,3298.358 3220.886,3314.315C3294.094,3346.827 3422.519,3267.269 3425.262,3252.638C3429.856,3228.136 3350.516,3039.081 3324.619,2986.984C3302.892,2943.274 3028.502,2616.685 3003.544,2604.744C2916.496,2563.094 2789.717,2468.088 2689.817,2538.566C2586.416,2611.513 2591.995,2668.375 2593.346,2682.147Z"
							style="fill:rgb(252,234,177);"
						/>
						<clipPath id="_clip1">
							<path
								d="M2593.346,2682.147C2594.775,2720.02 2627.413,2915.037 2909.232,2902.004C2905.615,2906.441 2884.338,2924.401 2897.43,2944.334C2944.206,3015.552 3184.955,3298.358 3220.886,3314.315C3294.094,3346.827 3422.519,3267.269 3425.262,3252.638C3429.856,3228.136 3350.516,3039.081 3324.619,2986.984C3302.892,2943.274 3028.502,2616.685 3003.544,2604.744C2916.496,2563.094 2789.717,2468.088 2689.817,2538.566C2586.416,2611.513 2591.995,2668.375 2593.346,2682.147Z"
							/>
						</clipPath>
						<g clip-path="url(#_clip1)">
							<g transform="matrix(1,0,0,1,380,-2)">
								<path
									d="M2529.017,2904.156C2546.357,2905.229 2566.639,2890.048 2569.408,2877.596"
									style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;"
								/>
							</g>
						</g>
						<path
							d="M2593.346,2682.147C2594.775,2720.02 2627.413,2915.037 2909.232,2902.004C2905.615,2906.441 2884.338,2924.401 2897.43,2944.334C2944.206,3015.552 3184.955,3298.358 3220.886,3314.315C3294.094,3346.827 3422.519,3267.269 3425.262,3252.638C3429.856,3228.136 3350.516,3039.081 3324.619,2986.984C3302.892,2943.274 3028.502,2616.685 3003.544,2604.744C2916.496,2563.094 2789.717,2468.088 2689.817,2538.566C2586.416,2611.513 2591.995,2668.375 2593.346,2682.147Z"
							style="fill:none;stroke:black;stroke-width:52.71px;"
						/>
					</g>

					<!-- ── MIDDLE → Experience (coral) ───────────────────── -->
					<g
						class="brain-seg {segClass('middle', active)}"
						transform="matrix(0.237131,0,0,0.237131,2070.50689,1202.395851)"
						role="button"
						tabindex="0"
						aria-label="Show Experience"
						on:click={() => goToRegion('middle')}
						on:keydown={(e) => onKey(e, 'middle')}
					>
						<path
							d="M3213.486,2386.913C2742.861,2451.126 2887.617,2754.718 3040.725,2776.295C3044.347,2961.52 3146.173,2994.763 3300.504,3033.192C3374.745,3051.678 3383.165,3048.309 3508.541,3053.986C3652.669,3060.511 3658.046,3051.469 3797.96,3016.081C3880.313,2995.252 4456.524,2595.634 4007.071,2447.509C3931.52,2422.61 3395.21,2362.118 3213.486,2386.913Z"
							style="fill:rgb(251,189,164);"
						/>
						<clipPath id="_clip2">
							<path
								d="M3213.486,2386.913C2742.861,2451.126 2887.617,2754.718 3040.725,2776.295C3044.347,2961.52 3146.173,2994.763 3300.504,3033.192C3374.745,3051.678 3383.165,3048.309 3508.541,3053.986C3652.669,3060.511 3658.046,3051.469 3797.96,3016.081C3880.313,2995.252 4456.524,2595.634 4007.071,2447.509C3931.52,2422.61 3395.21,2362.118 3213.486,2386.913Z"
							/>
						</clipPath>
						<g clip-path="url(#_clip2)">
							<g transform="matrix(1,0,0,1,374,-2)">
								<path
									d="M2666.726,2779.141C2819.484,2779.141 2911.317,2712.201 2951.768,2676.41"
									style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;"
								/>
							</g>
						</g>
						<path
							d="M3213.486,2386.913C2742.861,2451.126 2887.617,2754.718 3040.725,2776.295C3044.347,2961.52 3146.173,2994.763 3300.504,3033.192C3374.745,3051.678 3383.165,3048.309 3508.541,3053.986C3652.669,3060.511 3658.046,3051.469 3797.96,3016.081C3880.313,2995.252 4456.524,2595.634 4007.071,2447.509C3931.52,2422.61 3395.21,2362.118 3213.486,2386.913Z"
							style="fill:none;stroke:black;stroke-width:52.71px;"
						/>
					</g>

					<!-- ── BIG → Projects (mint) ─────────────────────────── -->
					<g
						class="brain-seg {segClass('big', active)}"
						transform="matrix(0.237131,0,0,0.237131,2159.193919,1201.921589)"
						role="button"
						tabindex="0"
						aria-label="Show Projects"
						on:click={() => goToRegion('big')}
						on:keydown={(e) => onKey(e, 'big')}
					>
						<g transform="matrix(1,0,0,1,-326,-5)">
							<path
								d="M3323.879,2492.709C3323.879,2492.709 3236.221,2595.178 3051.384,2602.453C2913.079,2607.896 2722.627,2600.256 2722.627,2600.256C2722.627,2600.256 2488.899,2710.303 2379.071,2740.952C2229.729,2782.628 2095.926,2784.628 2005.674,2707.669C1952.672,2662.473 1728.073,2751.635 1632.106,2437.162C1516.138,2409.086 1297.16,2485.123 1102.119,2038.527C1082.256,1993.048 939.051,1798.004 1067.03,1364.638C1148.344,1089.289 1554.975,933.836 1554.975,933.836C1551.502,878.142 1851.869,672.682 2229.504,792.86C2300.51,755.966 2428.986,716.341 2515.183,712.167C2699.029,703.264 2841.468,770.298 2841.468,770.298C2841.468,770.298 2856.92,703.662 3239.709,751.343C3408.651,772.387 3438.952,897.287 3454.525,927.676C3449.645,916.684 3443.851,902.456 3441.97,891.464C3440.587,883.38 3705.117,848.08 3937.636,1108.47C3991.199,1168.454 4048.725,1221.553 4048.725,1221.553C4048.725,1221.553 4100.982,1248.729 4139.366,1274.618C4210.72,1322.744 4222.308,1505.344 4219.087,1527.233C4232.647,1529.504 4243.345,1517.665 4311.683,1578.428C4384.177,1642.885 4376.838,1666.01 4389.673,1761.615C4460.995,1839.35 4419.957,1922.921 4419.957,1922.921C4419.957,1922.921 4420.96,1958.048 4430.802,1981.302C4528.688,2212.572 4374.842,2337.413 4374.842,2337.413C4374.842,2337.413 4341.788,2415.904 4249.868,2470.449C4032.784,2599.265 3602.454,2478.659 3602.454,2478.659C3549.794,2525.747 3440.829,2520.325 3323.879,2492.709Z"
								style="fill:rgb(187,231,211);stroke:black;stroke-width:52.71px;"
							/>
						</g>
						<path d="M1594.279,2683.561C1743.635,2683.561 1746.203,2660.395 1751.823,2658.156C1765.167,2652.841 1794.768,2650.061 1801.445,2643.407C1817.104,2627.801 1890.265,2624.961 1934.693,2648.898" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M4039.297,2343.872C4038.646,2334.454 4033.917,2266.118 3997.203,2233.627C3952.558,2194.118 3947.926,2203.328 3888.573,2193.632C3902.723,2192.642 3935.388,2197.701 3954.52,2170.747C3972.319,2145.671 3972.265,2103.125 4023.478,2095.281" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M4095.603,1939.706C4096.212,1937.37 4092.08,1935.876 4075.422,1912.239C4059.082,1889.052 4010.056,1873.241 4003.77,1871.214" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M4063.687,1752.298C4060.587,1790.673 4058.061,1789.568 4037.656,1822.519" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3893.087,1515.731C3892.014,1539.183 3888.905,1677.425 3709.877,1742.356" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3821.543,1679.054C3850.731,1840.654 3802.916,1895.334 3789.893,1907.81" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3643.67,1631.299C3661.682,1674.985 3816.284,1794.744 3592.828,1922.847C3593.636,1941.417 3597.6,2032.534 3451.29,2107.117" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3600.111,1935.239C3677.427,1929.404 3685.095,2065.985 3685.847,2079.381" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3709.877,1204.975C3744.328,1252.05 3740.472,1265.487 3736.921,1322.68" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3239.832,1311.284C3508.576,1308.76 3563.87,1329.411 3602.178,1470.482" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3223.506,1378.907C3224.735,1330.135 3246.077,1266.18 3164.933,1235.715" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3086.542,1175.731C2901.007,1085.637 2808.727,1043.843 2610.598,1159.964C2529.842,1207.294 2527.224,1287.935 2422.695,1302.516C2529.662,1318.759 2492.206,1495.107 2472.936,1522.127" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M2696.475,1491.724C2825.264,1477.024 2759.972,1269.911 2869.847,1228.746" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M2784.572,1399.646C2796.387,1369.506 2840.604,1370.786 2892.416,1368.908" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3058.136,991.633C3041.085,982.961 2919.59,921.171 2823.397,946.09C2685.839,981.724 2679.326,1070.83 2660.666,1138.289" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1607.218,2551.303C1688.462,2544.832 1708.664,2426.859 1726.487,2395.611C1774.783,2310.935 1953.341,2242.767 2136.218,2218.384C2157.011,2215.611 2283.915,2198.691 2381.962,2126.921C2482.153,2053.582 2459.611,2035.819 2516.161,1925.1" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M2426.62,2092.771C2552.291,2092.771 2560.13,2088.374 2676.727,2042.455C2687.129,2038.359 2777.873,2016.398 2806.61,1992.876" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M2420.494,2096.355C2419.685,2137.089 2414.332,2156.582 2453.608,2196.848C2475.457,2219.248 2472.787,2221.234 2499.653,2238.523" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M2692.243,2068.557C3074.832,2090.995 3081.74,2068.434 3091.109,2037.832C3102.199,2001.613 3317.688,1866.058 3336.993,1773.011C3351.779,1701.742 3432.134,1672.336 3386.307,1513.357" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3349.534,1732.175C3417.873,1733.444 3431.918,1712.237 3467.532,1770.12" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3072.962,2064.457C3033.345,2149.179 3063.706,2185.901 3070.244,2194.39" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3162.307,1555.296C3158.329,1611.132 3173.171,1615.625 3139.068,1660.474" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3157.503,1631.941C3216.483,1592.209 3212.898,1585.268 3283.992,1571.818" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1904.01,2275.454C1785.725,2295.593 1697.41,2415.151 1545.852,2269.764" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M2041.335,1690.504C2086.262,1689.443 2209.896,1843.171 2045.994,1891.988C1943.484,1922.52 1725.468,1903.62 1595.155,1992.417C1587.64,1997.537 1468.476,2113.533 1425.865,2124.571" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1720.081,1936.127C1637.63,1810.262 1598.166,1817.475 1615.068,1667.337C1623.851,1589.32 1657.948,1573.799 1591.949,1469.031" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1817.303,1710.389C1790.406,1532.253 1812.888,1532.325 1814.678,1502.276C1817.724,1451.133 1749.88,1382.7 1829.931,1207.863C1929.883,989.562 1982.027,1001.291 2127.297,993.769" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M2127.776,1800.62C2162.049,1799.741 2251.69,1825.979 2398.845,1724.831C2457.42,1684.57 2432.306,1670.736 2436.731,1600.83" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M2203.268,1803.057C2328.857,1803.057 2353.573,1812.8 2464.811,1757.688C2771.307,1605.837 2867.989,1725.484 2914.543,1783.608" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M2766.86,1679.44C2843.181,1673.2 2837.554,1657.958 2877.918,1592.348C2903.141,1551.348 2947.771,1547.738 2954.889,1547.162" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M2108.983,1544.213C2007.582,1242.11 2198.735,1163.233 2465.725,976.424" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M2347.179,1051.55C2354.27,953.076 2326.982,945.01 2383.788,864.484C2391.391,853.707 2445.399,777.147 2515.468,765.298" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1969.562,1018C1970.225,999.488 1975.351,856.333 2109.219,833.314" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1925.479,813.797C1976.332,841.355 1977.899,821.682 2008.732,888.268" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1781.36,1391.486C1777.214,1385.392 1705.176,1339.244 1650.784,1331.227C1563.333,1318.339 1519.01,1356.386 1457.411,1386.677" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1596.974,1328.547C1562.442,1322.546 1536.109,1221.466 1556.865,1179.477" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1666.803,1073.308C1705.439,1103.653 1714.99,1077.516 1779.847,1107.016C1852.384,1140.009 1824.07,1188.391 1828.758,1210.436" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1435.891,1026.561C1597.937,928.69 1722.148,940.457 1821.154,939.389" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M3200.605,2290.209C3154.181,2291.517 3025.854,2242.445 2931.271,2278.274C2822.375,2319.524 2757.308,2345.836 2647.543,2272.539C2583.336,2428.992 2333.677,2426.504 2193.117,2425.243C2088.91,2537.213 2080.874,2531.981 2003.68,2536.13" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M2999.424,2488.475C2988.97,2486.481 2968.093,2478.356 2961.973,2471.155C2951.731,2459.104 2948.316,2452.013 2948.897,2442.316" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1294.562,2227.916C1256.938,2224.886 1087.357,2137.517 1066.33,2019.518" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M785.144,2049.31C840.254,1737.74 1211.185,1898.882 1297.952,1907.941C1314.553,1909.674 1394.134,1917.982 1487.493,1995.144C1520.282,2022.244 1515.541,2040.792 1556.66,2029.987" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M862.635,1900.069C795.631,1836.243 842.512,1773.15 697.983,1760.983" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M952.766,1157.058C954.61,1192.844 1020.525,1390.7 918.033,1523.008C902.099,1543.577 817.366,1652.959 695.54,1760.227" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1053.909,1018.286C1229.515,1007.028 1280.28,1143.345 1201.573,1284.481C1127.091,1418.038 1330.325,1482.386 1148.267,1659.323" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1230.914,1217.695C1231.654,1216.276 1226.889,1210.972 1310.439,1154.472C1342.375,1132.875 1407.847,1137.502 1416.404,1138.107" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1377.729,1589.762C1405.183,1682.971 1371.703,1743.456 1369.373,1783.781" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
						<path d="M1388.486,1661.089C1396.222,1623.215 1415.738,1632.533 1425.611,1596.179C1431.9,1573.021 1424.575,1548.136 1426.147,1524.19" style="fill:rgb(187,231,211);fill-opacity:0.15;stroke:black;stroke-width:52.71px;" />
					</g>
				</g>
			</svg>
		</div>

		<!-- ── Context pane ────────────────────────────────────────────
		     ONE axis per meaning: regions move HORIZONTALLY (scroll, the section
		     bar's arrows, or clicking a lobe), items move VERTICALLY as a plain
		     accordion inside the region's container. Same markup at every
		     breakpoint — only the image height and the blurb clamp differ. -->
		<div
			class="pointer-events-none absolute inset-x-0 top-[25vh] z-30 overflow-x-clip px-3 md:top-[26vh] md:px-4"
			style="opacity: {paneOpacity}; transition: opacity 0.3s;"
			aria-hidden={!active}
		>
			{#if active}
				{@const s = sections[active]}
				<div
					class="pointer-events-auto mx-auto flex w-full max-w-sm flex-col items-center md:max-w-lg"
				>
					<!-- region stepper (desktop): all regions shown, active one lit, the
					     rest greyed. The › order shows which way to scroll for the next
					     one; click one to jump straight there. -->
					<div class="mb-2 hidden flex-wrap items-center justify-center gap-x-1 gap-y-1 md:flex">
						{#each order as key, i}
							{@const on = key === active}
							<button
								type="button"
								class="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold uppercase tracking-widest transition-colors {on
									? 'text-charcoal'
									: 'text-charcoal/35 hover:text-charcoal/60'}"
								aria-current={on}
								on:click={() => goToRegion(key)}
							>
								<span
									class="h-2.5 w-2.5 rounded-full ring-2 {on ? 'ring-charcoal' : 'ring-charcoal/30'}"
									style="background:{on ? sections[key].color : 'transparent'};"
								></span>
								{sections[key].label}
							</button>
							{#if i < order.length - 1}
								<span class="text-sm text-charcoal/25" aria-hidden="true">›</span>
							{/if}
						{/each}
					</div>

					<!-- The region container slides as one piece: on a phone that
					     includes its ‹ › arrows, since they belong to the region being
					     replaced. Both copies are stacked in a single grid cell so the
					     outgoing one can overlap the incoming one instead of shoving it
					     down the page mid-transition. -->
					<div class="slide-stack w-full">
						{#key active}
							<div
								class="w-full"
								in:fly={{ x: slideDir * 90, duration: 320, easing: cubicOut }}
								out:fly={{ x: slideDir * -90, duration: 220, easing: cubicOut }}
							>
								<!-- ── MOBILE section bar. On a phone the three regions have no
								     visible "there's more over here" cue, so they get an explicit
								     ‹ Region › control. -->
								<div class="mb-3 flex w-full items-center justify-between gap-2 md:hidden">
									<button
										type="button"
										class="nav-arrow"
										aria-label="Previous section"
										on:click={() => stepRegion(-1)}
									>
										<svg
											class="nav-ico"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="3.2"
											stroke-linecap="round"
											stroke-linejoin="round"
											aria-hidden="true"
										>
											<path d="M15 4 L7 12 L15 20" />
										</svg>
									</button>
									<span
										class="flex flex-1 items-center justify-center gap-2 rounded-full border-[3px] border-charcoal bg-white px-3 py-1.5 shadow-cartoon-sm"
									>
										<span
											class="h-3 w-3 shrink-0 rounded-full ring-2 ring-charcoal"
											style="background:{s.color};"
										></span>
										<span class="text-xs font-extrabold uppercase tracking-widest text-charcoal">
											{s.label}
										</span>
										<span class="text-[0.65rem] font-bold text-charcoal-soft">
											{regionIndex + 1}/{totalRegions}
										</span>
									</span>
									<!-- On the last region this arrow leaves the pin for About, so it
									     turns into a ↓ rather than pretending there's more sideways. -->
									<button
										type="button"
										class="nav-arrow"
										aria-label={atLastRegion ? 'Continue to about me' : 'Next section'}
										on:click={() => stepRegion(1)}
									>
										<!-- Geometric chevrons, not text glyphs: ‹ › sit on the
										     baseline, so flex-centring their line box still leaves
										     them looking high inside the circle. -->
										<svg
											class="nav-ico"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="3.2"
											stroke-linecap="round"
											stroke-linejoin="round"
											aria-hidden="true"
										>
											<path d={atLastRegion ? 'M4 9 L12 17 L20 9' : 'M9 4 L17 12 L9 20'} />
										</svg>
									</button>
								</div>

								<!-- ── The region's items, as one accordion. Exactly one is open,
								     which is what keeps the container's height bounded — important,
								     since it's absolutely positioned between the parked brain and
								     the skip pill. -->
								<div
									class="w-full overflow-hidden rounded-xl border-[3px] border-charcoal bg-white shadow-cartoon"
								>
									{#each items as item, i (item.title)}
										{@const open = i === openIndex}
										<div class="border-b-[3px] border-charcoal last:border-b-0">
											<button
												type="button"
												class="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors {open
													? ''
													: 'hover:bg-cream'}"
												aria-expanded={open}
												style={open ? `background:${s.color};` : ''}
												on:click={() => toggleItem(i)}
											>
												<span
													class="h-3 w-3 shrink-0 rounded-full ring-2 ring-charcoal"
													style="background:{open ? 'white' : 'transparent'};"
												></span>
												<span class="flex-1 text-sm font-extrabold leading-snug text-charcoal">
													{item.title}
												</span>
												<span class="acc-sign" aria-hidden="true">{open ? '−' : '+'}</span>
											</button>

											{#if open}
												<div class="border-t-[3px] border-charcoal">
													{#if imgSrc(item.image)}
														<!-- `contain`, not `cover`: these are hero images with
														     titles baked in, and cover was slicing the wordmark
														     off the top. Any letterboxing fills with the region's
														     own colour so it reads as intentional. -->
														<img
															src={imgSrc(item.image)}
															alt={item.title}
															class="h-36 w-full object-contain md:h-56"
															style="background:{s.color};"
															loading="lazy"
														/>
													{/if}
													<div class="px-3.5 py-3">
														<p class="line-clamp-3 text-sm leading-normal text-charcoal-soft md:line-clamp-none">
															{item.details}
														</p>
														{#if item.tags?.length}
															<div class="mt-2.5 flex flex-wrap gap-1.5">
																{#each item.tags as tag}
																	<span class="tv-tag">{tag}</span>
																{/each}
															</div>
														{/if}
														{#if item.href}
															<a
																href={item.href}
																target={isExternal(item.href) ? '_blank' : undefined}
																rel={isExternal(item.href) ? 'noopener noreferrer' : undefined}
																class="tv-link"
															>
																{isExternal(item.href) ? 'Visit' : 'Read'} →
															</a>
														{/if}
													</div>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/key}
					</div>
				</div>
			{/if}
		</div>


		<!-- Skip button — jump past the whole brain section to About. Pinned
		     bottom-right, fades in with the brain. -->
		<button
			type="button"
			class="pointer-events-auto absolute bottom-3 right-3 z-40 inline-flex items-center gap-1.5 rounded-full border-[3px] border-charcoal bg-white px-3 py-1.5 text-xs font-extrabold text-charcoal shadow-cartoon-sm hover:-translate-y-0.5 sm:bottom-6 sm:right-6 sm:px-4 sm:py-2 sm:text-sm {brainInteractive
				? ''
				: 'pointer-events-none'}"
			style="opacity: {brainOpacity}; transition: opacity 0.3s ease, transform 0.2s ease;"
			aria-hidden={!brainInteractive}
			tabindex={brainInteractive ? 0 : -1}
			on:click={skipIntro}
		>
			Skip to about me
			<span aria-hidden="true">↓</span>
		</button>
	</div>

	<!-- Scroll-snap markers — one invisible target per animated beat (hero +
	     each region). Every beat except the hero uses `scroll-snap-stop: always`
	     so a fast flick can't skip past a region — it's forced to stop on the
	     next one. -->
	{#each snapTs as st, i (st)}
		<div
			class="snap-pt {i > 0 ? 'snap-stop' : ''}"
			style="top: {st * 100}vh;"
			aria-hidden="true"
		></div>
	{/each}

	<!-- Hash anchors — one per region, parked at that region's scroll beat, so
	     /#projects (and friends) land directly on it. -->
	{#each order as key, k (key)}
		<div
			id={REGION_ID[key]}
			class="region-anchor"
			style="top: {(ZOOM_END + ((k + 0.5) / totalRegions) * dwell) * 100}vh;"
			aria-hidden="true"
		></div>
	{/each}
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

<style>
	/* Scroll-snap the animated intro beats. `proximity` (not `mandatory`) snaps
	   to the nearest marker when you pause near one, without trapping you inside
	   the tall content sections further down. Scoped to the home page: the rule
	   only applies while this component is mounted. */
	:global(html) {
		scroll-snap-type: y proximity;
		overflow-x: hidden;
	}
	/* Invisible snap targets positioned down the intro at each beat's offset. */
	.snap-pt {
		position: absolute;
		left: 0;
		width: 1px;
		height: 1px;
		pointer-events: none;
		scroll-snap-align: start;
	}
	/* Forbid the scroll from flying past a region beat — one flick = one region. */
	.snap-stop {
		scroll-snap-stop: always;
	}
	/* Invisible link targets at each region's beat (see REGION_ID). */
	.region-anchor {
		position: absolute;
		left: 0;
		width: 1px;
		height: 1px;
		pointer-events: none;
	}

	/* Brain segments. NO transform-box/transform-origin here — the <g>s carry
	   the art's matrix() positioning transform and those props would break it.
	   (So the clickable affordance is opacity/filter only, never a transform.) */
	.brain-seg {
		cursor: pointer;
		transition:
			opacity 0.35s ease,
			filter 0.35s ease;
	}
	.brain-seg:focus {
		outline: none;
	}
	/* Nothing selected yet → gently breathe to invite a click. */
	.brain-seg.is-idle {
		animation: seg-breathe 2.6s ease-in-out infinite;
	}
	@keyframes seg-breathe {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.68;
		}
	}
	.brain-seg.is-dim {
		opacity: 0.28;
	}
	.brain-seg.is-active {
		filter: drop-shadow(0 10px 14px rgba(45, 42, 50, 0.35));
	}
	/* Clear hover affordance: solid + a lifted glow (beats the idle animation). */
	.brain-seg:hover {
		opacity: 1 !important;
		animation: none;
		filter: drop-shadow(0 8px 12px rgba(45, 42, 50, 0.45));
	}

	/* Stacks the outgoing and incoming region containers in ONE grid cell, so
	   during the cross-slide they overlap instead of the outgoing one pushing
	   the incoming one down. */
	.slide-stack {
		display: grid;
	}
	.slide-stack > :global(*) {
		grid-area: 1 / 1;
	}

	/* ── Shared card bits (chips, links) ───────────────────────────── */
	.tv-tag {
		display: inline-block;
		border: 2px solid var(--color-charcoal);
		border-radius: 9999px;
		padding: 0.05rem 0.5rem;
		font-size: 0.66rem;
		font-weight: 800;
		color: var(--color-charcoal);
		background: var(--color-cream);
	}
	.tv-link {
		display: inline-block;
		margin-top: 0.55rem;
		border: 2px solid var(--color-charcoal);
		border-radius: 9999px;
		padding: 0.15rem 0.7rem;
		font-size: 0.72rem;
		font-weight: 800;
		color: var(--color-charcoal);
		background: white;
		transition: transform 0.2s ease;
	}
	.tv-link:hover {
		transform: translateY(-1px);
	}

	/* Accordion open/close sign. */
	.acc-sign {
		display: flex;
		height: 1.25rem;
		width: 1.25rem;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		border: 2px solid var(--color-charcoal);
		border-radius: 9999px;
		font-size: 0.85rem;
		font-weight: 800;
		line-height: 1;
		color: var(--color-charcoal);
	}

	/* Region prev/next arrows (mobile section bar). */
	.nav-arrow {
		display: flex;
		height: 2.25rem;
		width: 2.25rem;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		border: 3px solid var(--color-charcoal);
		border-radius: 9999px;
		background: white;
		font-size: 1.25rem;
		font-weight: 800;
		line-height: 1;
		color: var(--color-charcoal);
		box-shadow: var(--shadow-cartoon-sm);
		transition: transform 0.2s ease;
	}
	.nav-ico {
		width: 1.05rem;
		height: 1.05rem;
	}
	.nav-arrow:hover {
		transform: translateY(-2px);
	}
	.nav-arrow:active {
		transform: translate(2px, 2px);
		box-shadow: none;
	}
</style>

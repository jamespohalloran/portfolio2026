<script>
	// Resolves static assets correctly under any deploy base path ('' by default).
	import { base } from '$app/paths';
	import { onDestroy, onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
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
	// Media, in the order the open panel prefers it: `video` > `gif` > `image` >
	// nothing (the motion clips are a projects-only thing). `image` stays the
	// still the closed row's thumbnail and the video's poster use, so a heavy
	// clip is only ever fetched once its panel is open. `logo` is thumbnail-only
	// — it's what the jobs show in their closed row, since blowing a logo up to
	// panel size looks like an ad.

	const sections = {
		big: {
			label: 'Personal Projects',
			color: '#a8e6cf',
			items: [
				{
					title: 'Kinda Hard Golf',
					details:
						'A daily golf game I built solo in PixiJS over a few weeks. It struck a chord — over 4 million players to date and a steady 10k DAU — and after shipping 400 daily levels I sold the IP to a team of daily-game veterans.',
					tags: ['4M+ players', '10k DAU', 'Sold the IP'],
					href: 'https://kindahardgolf.com',
					image: 'https://kindahardgolf.com/hero.jpg',
					video: '/projects/kindahardgolf/gameplay.mp4'
				},
				{
					title: 'Squishy Billiards',
					details:
						'Pool, with a gooey chaotic twist and fresh daily levels. A physics playground I built to see if lightning could strike twice.',
					tags: ['Daily levels', 'Physics toy'],
					href: 'https://squishybilliards.com',
					image: 'https://squishybilliards.com/hero.jpg',
					video: '/projects/squishybilliards/squishy-billiards-gameplay.mp4'
				},
				{
					title: 'Miner Meltdown',
					details:
						'A multiplayer sabotage/mining game I built solo and shipped on Steam over several years, growing it to 25,000+ players on a shoestring budget before selling the IP in 2020.',
					tags: ['Steam', '25k+ players', 'Sold the IP in 2020'],
					href: 'https://store.steampowered.com/app/426190/Miner_Meltdown/',
					image: '/projects/minermeltdown/minermeltdown.png',
					gif: '/projects/minermeltdown/gameplay.gif'
				}
			]
		},
		middle: {
			label: 'Work Experience',
			color: '#ffb59e',
			items: [
				{
					title: 'Brilliant.org',
					role: 'Senior Software Engineer, Interactives',
					period: 'Sept 2025 — Present',
					details:
						'Building the interactive learning experiences that make complex STEM concepts click — designing them to be robust, flexible and AI-interoperable so the same interactive works across wildly different lesson formats.',
					tags: ['Interactives', 'STEM', 'AI-interoperable'],
					logo: '/logos/brilliant.png'
				},
				{
					title: 'Iron Fox Games',
					role: 'Staff Software Engineer · Team Lead, Web',
					period: 'Mar 2024 — Sept 2025',
					details:
						'Led the web team building games for Poki.com in TypeScript, PixiJS, Three.js and React — played by millions globally. Spearheaded a rebuild of the team’s tech stack that cut load times 10×.',
					tags: ['Team lead', 'PixiJS / Three.js', '10× faster loads'],
					logo: '/logos/iron_fox_games_logo.jpeg'
				},
				{
					title: 'Forestry.io / TinaCMS',
					role: 'Senior Software Engineer · Team Lead, Enterprise',
					period: 'Oct 2017 — Dec 2023',
					details:
						'Led a remote team of 5 building a SaaS Content API on React/TypeScript, GraphQL, Node.js, AWS and DynamoDB, plus the enterprise layer around it — SSO, RBAC and audit logging. Developer tooling that bridged fast, well-engineered sites and editing non-developers could actually use.',
					tags: ['DevTools', 'GraphQL', 'SSO / RBAC'],
					logo: '/logos/tinacms.jpg'
				},
				{
					title: 'Earlier work',
					role: 'Adeptio · Telos Entertainment · SwiftRadius',
					period: '2011 — 2015',
					details:
						'A cloud-based marketing automation platform in ASP.NET at Adeptio/Spokefire; “My Ocean”, an educational Unity3D game for National Geographic at Telos; and iOS/BlackBerry prototypes for the provincial government at SwiftRadius.',
					tags: ['ASP.NET', 'Unity3D', 'Mobile'],
					logo: '/logos/telos.jpg'
				}
			]
		}
	};
	// --- Scroll transition state -----------------------------------------
	let scrollY = 0;
	let innerHeight = 1;
	let innerWidth = 0;

	// ONE CSS vh, in pixels — the unit ALL of this section's scroll math must use.
	//
	// Everything positioned down the pin is expressed in `vh`: the pin's own
	// height (introVH), the snap markers, the region anchors. On mobile `vh` is
	// the LARGE viewport and stays put as the URL bar hides. `innerHeight` is the
	// VISUAL viewport and shrinks the moment there's scroll room for that bar.
	// Computing beat targets from innerHeight therefore aimed every jump a little
	// off the snap markers, and when mandatory snapping came back 80ms later the
	// browser hauled the scroll onto the real marker — the flicker, and it only
	// showed up when there was room above to scroll (i.e. a visible URL bar).
	// `layerH` is the `h-screen` brain layer measured, so it IS 100vh.
	$: vhPx = layerH || innerHeight || 1;

	// Viewports scrolled. The intro is pinned (sticky layer below) long enough
	// to zoom in and then dwell, so you can click the brain.
	$: t = scrollY / vhPx;

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
	const order = ['big', 'middle'];
	$: totalRegions = order.length;

	// Viewports of scroll per region. Half a viewport is about one comfortable
	// flick, so each flick lands on the next region — and the one-beat clamp in
	// `onScrollIdle` guarantees it can't overshoot into the one after. The pin
	// height (introVH) is derived from this.
	const PER_REGION = 0.5;
	$: dwell = Math.max(totalRegions * PER_REGION, 0.5);
	// Region beats sit at slice CENTRES, so a full-length pin leaves half a slice
	// of dead tail after the last one — scroll that changes nothing but still
	// holds you in the pinned section. Trim most of it: the pin now releases
	// shortly after the Writing beat.
	$: introVH = Math.round((1 + ZOOM_END + dwell * 0.9) * 100);

	// Scroll-snap beats: the hero (t=0), then one per region (centered in its
	// slice, brain settled). There is deliberately NO beat at the end of the
	// zoom — you should never come to rest on a bare, contentless brain.
	$: snapTs = [
		0,
		...Array.from({ length: totalRegions }, (_, k) => ZOOM_END + ((k + 0.5) / totalRegions) * dwell)
	];

	// Progress through the dwell (after the zoom completes) → region.
	$: browse = Math.min(Math.max((t - ZOOM_END) / dwell, 0), 1);
	$: regionIndex = regionIndexAt(t);
	// Same math, callable outside the reactive graph — the scroll listener below
	// needs to ask "which region is `window.scrollY` in?" without waiting for the
	// bound `scrollY` to propagate.
	function regionIndexAt(pos) {
		if (!totalRegions) return 0;
		const b = Math.min(Math.max((pos - ZOOM_END) / dwell, 0), 1);
		return Math.min(Math.floor(b * totalRegions), totalRegions - 1);
	}

	// A DELIBERATE jump (an arrow, a chip, a lobe) names its region up front, so
	// the pane switches in the same frame as the tap instead of waiting for the
	// bound `scrollY` to round-trip through the browser's scroll event.
	//
	// It is released by EVENTS, never by a timer. A timer has to guess how long
	// the browser will take to report the new scroll position, and on mobile that
	// guess is routinely wrong — scroll events are deferred, especially right
	// after a programmatic scroll. When the timer won that race the pane fell
	// back to the region the STALE scrollY still named, i.e. the one you started
	// on: tap ›, see the next region, get bounced back. The two things that
	// genuinely end the override are (a) the scroll arriving where we asked, and
	// (b) the user starting their own gesture — both observable, neither timed.
	let pendingRegion = null;
	$: active = brainInteractive ? (pendingRegion ?? order[regionIndex]) : null;

	// (a) The scroll agrees → hand control back to it. Reads `window.scrollY`
	// directly rather than the bound copy, since this IS the event that updates
	// the bound copy.
	function syncRegionToScroll() {
		if (pendingRegion === null) return;
		if (order[regionIndexAt(window.scrollY / vhPx)] === pendingRegion) pendingRegion = null;
	}
	// (b) The user took over. A wheel or a new touch means scroll is the truth
	// again, whatever we were mid-way through asking for. (The arrow's own
	// touchstart fires BEFORE its click, so this never eats the tap it belongs
	// to — it clears an older override, then the click sets the new one.)
	function releaseRegion() {
		pendingRegion = null;
	}

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

	// Measured size of the brain layer itself — NOT window.innerWidth/Height.
	// The layer is `h-screen`, i.e. CSS 100vh, which on mobile is the LARGE
	// viewport and stays put; `window.innerHeight` is the visual viewport and
	// shrinks/grows as the URL bar hides. Driving the park geometry off the
	// window meant the target moved the moment the bar collapsed — the brain
	// "snapping" at the end of its shrink.
	let layerW = 0;
	let layerH = 0;
	$: boxW = layerW || innerWidth;
	$: boxH = layerH || innerHeight;

	// `object-cover` fit of the canvas into that box.
	$: cover = Math.max(boxW / CANVAS_W, boxH / CANVAS_H);
	$: artX = (boxW - CANVAS_W * cover) / 2;
	$: artY = (boxH - CANVAS_H * cover) / 2;
	// The brain's untransformed box, in viewport pixels.
	$: brainW = BRAIN_W * cover;
	$: brainH = BRAIN_H * cover;
	$: brainCx = artX + (BRAIN_X + BRAIN_W / 2) * cover;
	$: brainCy = artY + (BRAIN_Y + BRAIN_H / 2) * cover;

	// Parked size, expressed as a share of the viewport width so it reads the
	// same on any screen.
	//
	// The two breakpoints park it differently because the pane sits differently.
	// On DESKTOP the pane is a fixed-width card in the top-left, so everything
	// right of it is free: the brain grows and centres in that column, and the
	// screen reads as two halves. On a PHONE the pane is centred and effectively
	// full-width, so there is no free column — the brain keeps its small
	// top-right tuck, out of the pane's way.
	const PANE_W = 560; // the md pane at its widest: max-w-lg (32rem) + px-6 gutters
	$: parkScale = brainW ? (boxW * (isNarrow ? 0.3 : 0.36)) / brainW : 1;
	$: parkHalfW = (brainW * parkScale) / 2;
	$: parkHalfH = (brainH * parkScale) / 2;
	// Both axes are clamped, never just set: a narrow desktop window (or a short
	// one) would otherwise push the centred brain off the right edge or up under
	// the header.
	$: parkCx = isNarrow
		? boxW - PARK_GAP - parkHalfW
		: Math.min(PANE_W + (boxW - PANE_W) / 2, boxW - PARK_GAP - parkHalfW);
	$: parkCy = isNarrow
		? HEADER_H + PARK_GAP + parkHalfH
		: Math.max((HEADER_H + boxH) / 2, HEADER_H + PARK_GAP + parkHalfH);
	// ORIGIN ('61% 43%') as pixels — the layer box is the viewport. Scaling about
	// it leaves that point fixed, so the translate we need is just the gap
	// between where the centre lands after scaling and where we want it.
	$: parkTx = parkCx - (boxW * 0.61 + parkScale * (brainCx - boxW * 0.61));
	$: parkTy = parkCy - (boxH * 0.43 + parkScale * (brainCy - boxH * 0.43));

	// `settle` is derived straight from scrollY, and the whole settle plays out
	// over ~0.17 viewports — so on a phone (coarse, throttled scroll sampling,
	// plus the snap/dead-zone scrolls covering that distance in a few frames)
	// the brain would arrive in two or three big steps: the jerk. Easing a
	// SMOOTHED copy toward the target each frame decouples the animation from
	// how finely the browser happens to report scroll. The zoom itself still
	// tracks raw scroll 1:1 (via dishScale) — only the settle pose is damped.
	//
	// It is BYPASSED while one of our own jumps is animating. A jump already
	// drives the scroll frame by frame, so `settle` is smooth on its own there —
	// filtering it anyway meant two animations of different lengths running at
	// once (the 1.9s scroll tween and this ~200ms lag filter), with the brain's
	// scale mixing a term that tracks scroll exactly (dishScale) with one that
	// trails it. That mismatch is the wobble on the way back to the hero.
	let settleSmooth = 0;
	let easeRaf = 0;
	let easeLast = 0;
	$: ease(settle);
	function ease(target) {
		if (typeof window === 'undefined') {
			settleSmooth = target;
			return;
		}
		cancelAnimationFrame(easeRaf);
		if (jumpRaf) {
			settleSmooth = target; // the jump is the clock; don't add a second one
			return;
		}
		easeLast = 0;
		const step = (now) => {
			const d = target - settleSmooth;
			if (Math.abs(d) < 0.002) {
				settleSmooth = target;
				return;
			}
			// Framerate-independent: a fixed per-frame fraction converged twice as
			// fast on a 120Hz screen as on a 60Hz one, so the same motion read
			// differently depending on the display.
			const dt = easeLast ? Math.min(now - easeLast, 64) : 16.7;
			easeLast = now;
			settleSmooth += d * (1 - Math.pow(1 - 0.26, dt / 16.7));
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
	//
	// Keyed off `active`, NOT `regionIndex`: with a tap now switching the region
	// ahead of the scroll, regionIndex lags, and reading direction from it would
	// leave the slide pointing the wrong way for the whole animation.
	// (Falls back to regionIndex, not prevRegion — reading the tracker here would
	// make this a reactive cycle.)
	$: activeIndex = active ? order.indexOf(active) : regionIndex;
	let slideDir = 1;
	let prevRegion = 0;
	$: if (activeIndex !== prevRegion) {
		slideDir = activeIndex > prevRegion ? 1 : -1;
		prevRegion = activeIndex;
	}
	function toggleItem(i) {
		openIndex = openIndex === i ? -1 : i;
	}

	onDestroy(() => {
		clearTimeout(idleTimer);
		clearTimeout(wheelLockTimer);
		// onDestroy also runs during SSR, where rAF doesn't exist.
		if (typeof window !== 'undefined') cancelAnimationFrame(easeRaf);
	});

	// --- Beats: the ONE controller of scroll position ---------------------
	// This section used to have three things steering the same scroll: CSS
	// scroll-snap (`y mandatory` + `scroll-snap-stop: always`), a corrective idle
	// guard, and our own programmatic jumps — each of which had to disable or
	// bypass the others to get anything done. Every scroll bug here came out of
	// that fight. Snapping is now done in JS, on the same code path as the jumps,
	// so there is nothing left to race: no snap-mode juggling, no suspend/restore
	// window, no guessed delays.
	//
	// "Beats" are the rest positions in order: the hero, one per region, and
	// finally the top of About. That last one is what gives LEAVING the section
	// the same friction as moving inside it — previously the forward swipe off
	// the last region wasn't captured at all, so it fell through to the browser
	// and you shot out with full momentum while every other step needed a
	// deliberate push. Now every step costs exactly one swipe, including the exit.
	$: pinEnd = introVH / 100; // where the pinned container ends and About begins
	$: beatTs = [...snapTs, pinEnd];
	function nearestBeat(pos) {
		let best = 0;
		for (let i = 1; i < beatTs.length; i++) {
			if (Math.abs(beatTs[i] - pos) < Math.abs(beatTs[best] - pos)) best = i;
		}
		return best;
	}

	let idleTimer;
	// Position at the previous idle check. A debounce alone cannot tell "the
	// scroll stopped" from "the scroll paused": iOS coalesces scroll events
	// during momentum, and gaps longer than the debounce are routine. Acting on
	// one of those pauses meant animating to a beat while momentum was still
	// live — and a programmatic scroll does NOT cancel iOS momentum, so it
	// resumed, carried past, and the next idle accepted that as a legal one-beat
	// move. Net effect: flick from the top and sail straight through Personal
	// Projects. Requiring two consecutive samples at the same position means we
	// only ever settle from a genuine standstill.
	let lastIdleY = -1;
	// --- Gesture paging ----------------------------------------------------
	// Inside the pin the gesture is taken over completely: `preventDefault` stops
	// the native scroll, so native MOMENTUM never starts, and one swipe moves
	// exactly one section. Everything before this let the page scroll freely and
	// corrected afterwards — which is why it would coast for a second or two and
	// then get yanked somewhere. You cannot fix that by tuning thresholds; the
	// correction is always after the fact. Not scrolling in the first place is
	// the only way sections read as discrete.
	//
	// At either end of the beat list we deliberately DON'T capture, so the swipe
	// falls through to the browser and you scroll out of the section normally.
	const ZOOM_MS = 1900; // hero ⇄ first region: the zoom transition's duration
	const SWIPE_PX = 26; // finger travel before a swipe counts
	const WHEEL_PX = 32; // accumulated wheel delta before a notch counts
	// A trackpad flick emits a decaying stream of wheel events for up to a second
	// and a half, so one flick must not step more than once. Silence releases the
	// lock — but silence ALONE deadlocks: every event re-arms the timer, so a
	// stream that never goes quiet (a held two-finger scroll, overlapping flicks)
	// would freeze the section. The old fix was a hard 700ms ceiling, and that is
	// what made one swipe travel two sections: 700ms is shorter than both a
	// trackpad's momentum tail and the 1.9s zoom, so the lock lifted mid-flight
	// and the SAME flick's decaying tail immediately bought a second step.
	//
	// Time can't tell "still coasting" from "pushed again", so don't ask it to —
	// ask the deltas. But "the deltas are rising" is NOT enough on its own: a hard
	// flick ramps up over its first several events, and the step fires on the
	// first ~32px of it, so the rest of that same ramp read as a second push and
	// carried you a section further. A gesture has to be seen DYING before
	// anything is allowed to count as new.
	//
	// So the lock lifts early only after both, in order:
	//   1. spent — a magnitude drops under a fraction of this gesture's peak, i.e.
	//      the flick has decayed. A ramp-up can never satisfy this.
	//   2. rising — with only post-decay samples in hand, the newer window
	//      averages above the older one: a genuine new push.
	// Constant-magnitude input (a mouse wheel's notches) satisfies neither and
	// doesn't need to — its notches are spaced far enough apart for the quiet
	// timer, and the backstop below covers a sustained one.
	const WHEEL_QUIET = 140; // ms of no wheel events → next step allowed
	const WHEEL_SAMPLES = 8; // magnitudes per comparison window
	const WHEEL_DECAY = 0.35; // fraction of peak that counts as "this flick is over"

	// Capture stops just BEFORE the exit beat, so once you've landed on About the
	// page scrolls normally; swiping back up re-enters and steps to the last
	// region.
	$: inPin = t < pinEnd - 0.02;
	let touchStartY = 0;
	let touchDY = 0;
	let touchStepped = false;
	let wheelAcc = 0;
	let wheelLock = false;
	let wheelLockTimer;
	let wheelMags = [];
	let wheelPeak = 0; // largest magnitude seen since the lock engaged
	let wheelSpent = false; // ...and whether it has since decayed away
	// Liveness backstop, not a step timer: a stream that neither goes quiet nor
	// rises (a held two-finger scroll, a fast mouse-wheel spin) would otherwise
	// hold the lock forever. Unlike the old ceiling this is armed from the END of
	// the jump it belongs to and is comfortably longer than any momentum tail, so
	// it can never hand the same flick a second step.
	// It must outlast the longest momentum tail a trackpad can produce (~1.5s),
	// measured from the FLICK, not from the animation — otherwise it just
	// reintroduces the old bug on whichever step animates fastest. The hero step
	// takes 1900ms and so was always covered; a region hop takes 420ms, and its
	// backstop was landing mid-tail, which is why projects → experience kept
	// coasting on into About while hero → projects behaved.
	let wheelMaxTimer;
	const WHEEL_TAIL = 1900; // ms a step stays locked, at minimum
	function releaseWheel() {
		clearTimeout(wheelLockTimer);
		clearTimeout(wheelMaxTimer);
		wheelLock = false;
		wheelAcc = 0;
		wheelMags = [];
		wheelPeak = 0;
		wheelSpent = false;
	}
	// True once we've seen a full two windows AND the newer one is decisively
	// bigger — i.e. the input is growing, which momentum never does.
	//
	// "Decisively" matters. The end of a tail is a handful of 1s, 2s and 3s, and
	// over eight-sample windows that noise crosses a bare `>` often enough to
	// smuggle a second step out of a dead gesture. A real push is an order of
	// magnitude louder than a tail's last gasps, so ask for both a clear ratio
	// and an absolute floor.
	const WHEEL_RISE = 1.6; // newer window must beat the older one by this much
	const WHEEL_FLOOR = 10; // ...and be this loud in absolute terms
	function wheelIsRising() {
		if (wheelMags.length < WHEEL_SAMPLES * 2) return false;
		const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
		const newer = avg(wheelMags.slice(WHEEL_SAMPLES));
		return newer > avg(wheelMags.slice(0, WHEEL_SAMPLES)) * WHEEL_RISE && newer > WHEEL_FLOOR;
	}

	// The beat a gesture steps FROM. While a jump is in flight that is its
	// DESTINATION, not the interpolated position it happens to be passing
	// through: mid-animation `nearestBeat(t)` still names the beat you're leaving
	// for most of the trip, so a second swipe would re-target the jump already
	// running and restart it. Harmless when jumps were ~300ms and you rarely
	// interrupted them; with the ~1.9s zoom, interrupting is the normal case and
	// it read as the section refusing to advance. Otherwise: derived from actual
	// position, which can't go stale the way stored state can.
	const currentBeat = () => (jumpRaf && jumpBeat !== null ? jumpBeat : nearestBeat(t));

	// True when `dir` from here lands on another beat — i.e. when this section
	// still owns the gesture rather than handing it to the browser.
	function canStep(dir) {
		const k = currentBeat() + dir;
		return k >= 0 && k < beatTs.length;
	}
	function stepBeat(dir) {
		const k = currentBeat() + dir;
		if (k < 0 || k >= beatTs.length) return;
		jumpTo(beatTs[k] * vhPx);
	}

	// Registered by hand, NOT through `<svelte:window on:…>`. Svelte 5 attaches
	// wheel/touch listeners as PASSIVE and ignores the `|nonpassive` modifier
	// there, which makes `preventDefault()` a silent no-op — the native scroll
	// (and its momentum) ran anyway while `touchend` also stepped a beat, so two
	// controllers fought over every gesture. `{ passive: false }` is the whole
	// point of this section, so it has to be explicit.
	onMount(() => {
		const opts = { passive: false };
		window.addEventListener('wheel', onWheel, opts);
		window.addEventListener('touchstart', onTouchStart, { passive: true });
		window.addEventListener('touchmove', onTouchMove, opts);
		window.addEventListener('touchend', onTouchEnd, { passive: true });
		window.addEventListener('touchcancel', onTouchEnd, { passive: true });
		return () => {
			window.removeEventListener('wheel', onWheel, opts);
			window.removeEventListener('touchstart', onTouchStart);
			window.removeEventListener('touchmove', onTouchMove, opts);
			window.removeEventListener('touchend', onTouchEnd);
			window.removeEventListener('touchcancel', onTouchEnd);
		};
	});

	function onTouchStart(event) {
		releaseRegion();
		touchStartY = event.touches[0].clientY;
		touchDY = 0;
		touchStepped = false;
	}
	function onTouchMove(event) {
		// Note: NOT gated on `brainInteractive`. The hero is beat 0, and the
		// hero → first region flick is the longest one — leaving it uncaptured is
		// exactly the swipe that used to coast past Personal Projects.
		if (!inPin) return;
		touchDY = event.touches[0].clientY - touchStartY;
		// Negative dy = finger moving up = scrolling forward.
		// Same rule as the wheel: while one of our jumps is animating, nothing else
		// may touch the scroll position — not even a gesture that has nowhere left
		// to step. `stepBeat` no-ops past the ends, so a swipe that can't step is
		// simply absorbed instead of turning into a native scroll that fights the
		// running rAF.
		if (!jumpRaf && !canStep(touchDY < 0 ? 1 : -1)) return; // at an end: scroll out
		event.preventDefault(); // no native scroll ⇒ no momentum to fight later
	}
	function onTouchEnd() {
		if (!inPin || touchStepped) return;
		if (Math.abs(touchDY) < SWIPE_PX) return; // too small to count as a swipe
		touchStepped = true; // one finger-down..finger-up is one step, always
		stepBeat(touchDY < 0 ? 1 : -1);
		touchDY = 0;
	}
	function onWheel(event) {
		releaseRegion();
		if (!inPin) return;
		const dir = event.deltaY > 0 ? 1 : -1;
		// While a step of ours is in flight we swallow the gesture even at the ends
		// of the beat list. Letting it through there meant the browser scrolled
		// natively while `jumpTo`'s rAF was writing a scroll position every frame —
		// two writers, one scrollTop, which is the stutter you see swiping back to
		// the hero (mid-jump `canStep(-1)` is false, so the tail escaped).
		if (!wheelLock && !jumpRaf && !canStep(dir)) return; // at an end: scroll out
		event.preventDefault();
		clearTimeout(wheelLockTimer);
		wheelLockTimer = setTimeout(releaseWheel, WHEEL_QUIET);
		const mag = Math.abs(event.deltaY);
		wheelMags.push(mag);
		if (wheelMags.length > WHEEL_SAMPLES * 2) wheelMags.shift();
		if (wheelLock) {
			wheelPeak = Math.max(wheelPeak, mag);
			if (!wheelSpent) {
				// Still on the way up, or coasting near the peak: this is the gesture
				// that already stepped. Nothing here can release the lock.
				if (mag > wheelPeak * WHEEL_DECAY) return;
				// It has died down. Judge what follows on its own samples only.
				wheelSpent = true;
				wheelMags = [];
				return;
			}
			if (!wheelIsRising()) return; // still a tail, not a new push
			releaseWheel();
			wheelLockTimer = setTimeout(releaseWheel, WHEEL_QUIET);
		}
		if (!canStep(dir)) return;
		wheelAcc += event.deltaY;
		if (Math.abs(wheelAcc) < WHEEL_PX) return;
		wheelAcc = 0;
		wheelLock = true;
		stepBeat(dir);
		clearTimeout(wheelMaxTimer);
		wheelMaxTimer = setTimeout(releaseWheel, Math.max(jumpMs, WHEEL_TAIL));
	}
	$: t, vhPx, queueIdleCheck();
	function queueIdleCheck() {
		if (typeof window === 'undefined') return;
		clearTimeout(idleTimer);
		idleTimer = setTimeout(onScrollIdle, 140);
	}
	// Scrolling has stopped. Settle onto a beat — which also enforces "never rest
	// mid-zoom on a bare brain", since the hero and the first region are the only
	// beats that stretch can round to.
	// Gestures inside the pin are captured and always land exactly on a beat, so
	// this is now only a safety net for scrolls that AREN'T gestures: keyboard,
	// scrollbar drags, a restored scroll position, a hash link. It settles onto
	// the nearest beat and nothing more — the one-beat clamp and the hysteresis
	// that used to live here existed solely to police free scrolling, which no
	// longer happens in this section.
	function onScrollIdle() {
		if (jumpRaf) return; // our own animation is still running
		// Still moving (or momentum merely paused) → wait for a real standstill.
		if (window.scrollY !== lastIdleY) {
			lastIdleY = window.scrollY;
			queueIdleCheck();
			return;
		}
		if (t >= pinEnd - 0.02) return; // at or below About: an ordinary document
		const target = beatTs[nearestBeat(t)] * vhPx;
		if (Math.abs(window.scrollY - target) < 2) return; // already there
		jumpTo(target);
	}

	// --- Programmatic scrolling -------------------------------------------
	// We animate frame by frame rather than using `behavior: 'smooth'` so the
	// motion is ours to cancel and reason about; iOS Safari in particular
	// interrupts native smooth scrolls unpredictably.
	let jumpRaf = 0;
	let jumpBeat = null; // beat index a running jump is heading for
	let jumpMs = 0; // duration of the jump that just started (see WHEEL_TAIL)

	// `instant` skips the animation and sets the position in one go — the right
	// mode for a REGION HOP, because between region beats nothing on screen is
	// scroll-animated: the brain is already parked and the pane is fixed, so
	// scroll position decides only which region is active. Animating it bought no
	// motion, just latency and a window for a stray event to strand the scroll
	// half-way.
	function jumpTo(top, instant = false) {
		if (typeof window === 'undefined') return;
		endJump(); // supersede any jump already running

		const from = window.scrollY;
		const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
		const to = Math.max(0, Math.min(top, max));
		const dist = Math.abs(to - from);
		if (dist < 2) return;
		if (instant) {
			// `behavior: 'instant'` is REQUIRED, not cosmetic: html carries
			// `scroll-behavior: smooth`, which would otherwise animate this.
			window.scrollTo({ top: to, behavior: 'instant' });
			jumpBeat = null;
			return;
		}
		// Queue further steps against where this jump is GOING.
		jumpBeat = nearestBeat(to / vhPx);
		// The step between the hero and the first region plays the ENTIRE zoom —
		// the signature move of the page — and it can't be timed by distance,
		// because it (0.65vh) is barely longer than a plain region hop (0.5vh).
		// So it gets its own duration. Note the zoom itself completes at ZOOM_END,
		// only ~60% of the way through the step, so the visible zoom is ~60% of
		// this number. THIS is the knob for "the zoom is too fast".
		const crossesZoom = Math.min(from, to) / vhPx < ZOOM_END;
		const ms = crossesZoom ? ZOOM_MS : Math.min(750, Math.max(420, dist * 0.85));
		jumpMs = ms;
		const t0 = performance.now();

		// NO "yield to the user" listeners here. Cancelling a jump part-way leaves
		// the scroll stranded BETWEEN beats — the half-faded brain-in-the-head
		// state. A new gesture supersedes the jump properly instead: every in-pin
		// gesture routes through `stepBeat` → `jumpTo`, which calls `endJump`
		// first and then animates to a real beat.
		const step = (now) => {
			const p = Math.min((now - t0) / ms, 1);
			const eased = 1 - Math.pow(1 - p, 3); // cubic-out
			// Same reason as above: each frame must land exactly where we say.
			window.scrollTo({ top: from + (to - from) * eased, behavior: 'instant' });
			if (p < 1) jumpRaf = requestAnimationFrame(step);
			else endJump();
		};
		jumpRaf = requestAnimationFrame(step);
	}

	function endJump() {
		if (jumpRaf) cancelAnimationFrame(jumpRaf);
		jumpRaf = 0;
		jumpBeat = null;
		jumpMs = 0;
	}

	// Leave the pinned brain section for About. This is the mobile section bar's
	// ↓ (what its › becomes on the last region) — the only explicit way out now
	// that the skip pill is gone; everywhere else you just keep scrolling. Snap
	// A plain animated jump like any other; the idle settle sees `t` land at or
	// below the exit beat and leaves it alone.
	function skipIntro() {
		const el = document.getElementById('about');
		if (!el) return;
		jumpTo(el.getBoundingClientRect().top + window.scrollY);
	}

	// Emphasis for a segment: the active one pops, the others dim; before the
	// zoom finishes they idle-pulse to invite a click.
	const segClass = (key, a) => (a === key ? 'is-active' : a ? 'is-dim' : 'is-idle');

	// Clicking a segment jumps the scroll straight to that region's slice.
	function goToRegion(key) {
		const k = order.indexOf(key);
		if (k < 0) return;
		const b = (k + 0.5) / totalRegions;
		jumpTo((ZOOM_END + b * dwell) * vhPx, true);
		pendingRegion = key;
		// The instant scroll above may already have landed; if so its event has
		// fired (or will fire with a stale-but-equal value), so reconcile now
		// rather than leaving the override up for no reason.
		syncRegionToScroll();
	}

	// Move one region forward/back (wraps). This is what the mobile section bar's
	// ‹ › arrows drive — on a phone there's no filmstrip to imply "there's more
	// over here", so the regions need an explicit control, not just scroll.
	// The regions are a LINE, not a loop: going forward off the end continues to
	// About (the section that follows the pin), and going back off the front
	// returns to the hero. Wrapping around would strand you in the pinned
	// section with no way out.
	//
	// Both step from `activeIndex` — the region ON SCREEN — not from
	// `regionIndex`, which is raw scroll position. Those disagree whenever you
	// scroll part-way back without landing on a beat: the pane still shows, say,
	// Work Experience while `regionIndex` has already rounded down to 0. Stepping
	// from the raw value then read `0 - 1`, so ‹ flung you out to the hero
	// instead of going to the first region, and the idle guard corrected on top
	// of that. `activeIndex` is what you're looking at, so it's what ‹ › mean.
	$: atLastRegion = activeIndex >= totalRegions - 1;
	function stepRegion(dir) {
		const k = activeIndex + dir;
		if (k >= totalRegions) return skipIntro();
		if (k < 0) {
			return jumpTo(0);
		}
		goToRegion(order[k]);
	}

	// Each region also gets a real anchor element parked at its scroll beat (see
	// `.region-anchor` below), so /#projects — the header's Projects link — drops
	// you straight onto the Projects region of the brain even without JS.
	const REGION_ID = { big: 'projects', middle: 'experience' };

	// ...but WITH JS we re-issue that jump ourselves, so a hash link and an arrow
	// tap take exactly the same path and land in exactly the same place.
	// Deferred a tick so we act after the browser's own anchor scroll rather than
	// racing it.
	afterNavigate(({ to }) => {
		const id = to?.url?.hash?.slice(1);
		if (!id) return;
		setTimeout(() => {
			const key = Object.keys(REGION_ID).find((k) => REGION_ID[k] === id);
			if (key) return goToRegion(key);
			const el = document.getElementById(id);
			// Instant, like a real anchor jump: animating here meant depending on
			// rAF and leaving a window for the snap engine to interfere again.
			if (el) jumpTo(el.getBoundingClientRect().top + window.scrollY, true);
		}, 0);
	});
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
<svelte:window
	bind:scrollY
	bind:innerHeight
	bind:innerWidth
	on:scroll={syncRegionToScroll}
/>

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

			<!-- The prompt is a pill in the same corner, and cut from exactly the
			     same cloth as the "Skip to about me" pill below — same radius,
			     border, shadow and type scale. The two never coexist (this one
			     fades out as the skip pill fades in, both driven by `reveal`), so
			     sharing a corner reads as one pill handing off to the other rather
			     than as clutter. The ↓ rides inside the pill; `leading-none` is
			     what actually centres it — the glyph sits high in its line box, so
			     flex-centring alone still leaves it floating above the text's
			     optical centre. -->
			<div class="absolute bottom-3 right-3 sm:bottom-6 sm:right-6">
				<p
					class="inline-flex items-center gap-1.5 rounded-full border-[3px] border-charcoal bg-white px-3 py-1.5 text-xs font-extrabold text-charcoal shadow-cartoon-sm sm:px-4 sm:py-2 sm:text-sm"
				>
					Scroll to see what's in James' head.
					<span class="animate-bounce text-sm leading-none sm:text-base" aria-hidden="true">↓</span>
				</p>
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
			bind:clientWidth={layerW}
			bind:clientHeight={layerH}
			aria-hidden={!brainInteractive}
		>
			<svg
				viewBox="0 0 4914 3981"
				preserveAspectRatio="xMidYMid slice"
				class="h-full w-full select-none"
				style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"
			>
				<g id="Brain">
					<!-- ── BOTTOM (yellow) — art only. The cerebellum has no region of
					     its own anymore (Writing lives in the blog section below), so it
					     is drawn but never clickable: no role, no handlers, no pulse. -->
					<g
						class="brain-seg-static"
						transform="matrix(0.237131,0,0,0.237131,2069.084103,1202.395851)"
						aria-hidden="true"
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
		     breakpoint — only the image height and the blurb clamp differ.

		     On desktop the pane sits TOP-LEFT, just under the fixed header, so it
		     and the parked brain (top-right) split the screen instead of stacking.
		     On a phone it stays centred and below the brain: the brain parks wider
		     there, so a left-aligned card would slide underneath it. -->
		<div
			class="brain-pane pointer-events-none absolute inset-x-0 top-[25vh] z-30 overflow-x-clip px-3 md:top-[5.25rem] md:px-6"
			style="opacity: {paneOpacity}; transition: opacity 0.3s;"
			aria-hidden={!active}
		>
			{#if active}
				{@const s = sections[active]}
				<div
					class="pointer-events-auto mx-auto flex w-full max-w-sm flex-col items-center md:mx-0 md:max-w-lg md:items-start"
				>
					<!-- region stepper (desktop): all regions shown, active one lit, the
					     rest greyed. The › order shows which way to scroll for the next
					     one; click one to jump straight there. -->
					<div class="mb-2 hidden flex-wrap items-center justify-start gap-x-1 gap-y-1 md:flex">
						{#each order as key, i}
							{@const on = key === active}
							<button
								type="button"
								class="flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold uppercase tracking-widest transition-colors {on
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
								in:fly={{ x: slideDir * 90, duration: 210, easing: cubicOut }}
								out:fly={{ x: slideDir * -90, duration: 140, easing: cubicOut }}
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
											<!-- A closed row still has to sell the item, so it carries a
											     thumbnail and a one-line blurb. Items with no artwork get a
											     lettered tile in the region's colour rather than a hole. -->
											<button
												type="button"
												class="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors {open
													? ''
													: 'hover:bg-cream'}"
												aria-expanded={open}
												style={open ? `background:${s.color};` : ''}
												on:click={() => toggleItem(i)}
											>
												{#if imgSrc(item.image ?? item.logo)}
													<!-- Hero art when there is any, else the company logo
													     (`logo` exists for the items with no artwork of their
													     own). It stays put when the row opens — the header
													     should read the same open or closed. `contain`, not
													     `cover`: aspect ratios vary wildly and cropping slices
													     titles off. The tile stays white — the region colour
													     behind a letterboxed image muddied both. -->
													<img
														src={imgSrc(item.image ?? item.logo)}
														alt=""
														class="acc-thumb object-contain"
														loading="lazy"
													/>
												{:else}
													<span
														class="acc-thumb flex items-center justify-center text-sm font-extrabold text-charcoal"
														style="background:{s.color};"
														aria-hidden="true">{item.title.slice(0, 1)}</span
													>
												{/if}
												<span class="min-w-0 flex-1">
													<span class="block text-sm font-extrabold leading-snug text-charcoal">
														{item.title}
													</span>
													{#if !open}
														<!-- A job's one-line tease is its title + dates, not the
														     blurb: that's what you actually scan a résumé for. -->
														<span
															class="mt-0.5 line-clamp-1 text-xs leading-snug text-charcoal-soft"
														>
															{item.role ? `${item.role} · ${item.period}` : item.details}
														</span>
													{/if}
												</span>
												<span class="acc-sign" aria-hidden="true">{open ? '−' : '+'}</span>
											</button>

											{#if open}
												<div class="border-t-[3px] border-charcoal">
													{#if item.video}
														<!-- Gameplay beats a still, so a project's clip wins over
														     its hero image. Muted + inline so phones will actually
														     autoplay it; the clip is the ambience, not something
														     you're meant to scrub, hence no controls. Deliberately
														     NOT `cover` — the current capture is portrait, and
														     cropping it to this box would leave a sliver. -->
														<!-- svelte-ignore a11y-media-has-caption -->
														<video
															src={base + item.video}
															poster={imgSrc(item.image)}
															class="h-36 w-full bg-charcoal object-contain md:h-56"
															autoplay
															muted
															loop
															playsinline
															preload="metadata"
														></video>
													{:else if item.gif}
														<!-- Same slot, but a GIF: it loops on its own, so it's an
														     <img>. Only mounted while the panel is open, which is
														     what keeps its weight off the closed rows. -->
														<img
															src={base + item.gif}
															alt="{item.title} gameplay"
															class="h-36 w-full bg-charcoal object-contain md:h-56"
														/>
													{:else if imgSrc(item.image)}
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
														{#if item.role}
															<p class="mb-1.5 text-xs font-extrabold leading-snug text-charcoal">
																{item.role}
																<span class="block font-bold text-charcoal-soft">{item.period}</span>
															</p>
														{/if}
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


	</div>

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
		<!-- A real photo among all the flat pastel art needs a reason to be
		     there, so it's framed as a snapshot: white polaroid card, the same
		     charcoal border and hard cartoon shadow as every other card, and a
		     couple of degrees of tilt so it reads as pinned to the page rather
		     than placed by a layout engine. It straightens on hover — the same
		     "things move when you touch them" language the cards use. -->
		<div class="mx-auto w-56 md:mx-0 md:w-full">
			<div
				class="-rotate-2 rounded-cartoon border-[3px] border-charcoal bg-white p-2.5 pb-8 shadow-cartoon transition-transform duration-300 ease-bouncy hover:rotate-0"
			>
				<img
					src="{base}/sommo.jpg"
					alt="James in sunglasses and a ball cap at an outdoor festival"
					class="block aspect-square w-full rounded-sm border-2 border-charcoal object-cover"
					loading="lazy"
				/>
			</div>
		</div>

		<div>
			<span class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">About Me</span>
			<h2 class="mt-3 text-4xl font-extrabold tracking-tight text-charcoal sm:text-5xl">
				Hey, I'm James.
			</h2>
			<p class="mt-5 text-lg leading-relaxed text-charcoal-soft">
				I’m a software engineer from PEI, Canada. I love building delightful, interactive web experiences. Most recently, I was on the Interactives team at Brilliant.org, crafting hands-on learning tools. On the side, I build my own web games: Kinda Hard Golf - (recently acquied), Squishy Billiards. I care deeply about great UX, clean architecture, and shipping things people actually love to play with.
			</p>
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
	/* Beat snapping is done in JS (see `onScrollIdle`), not with CSS scroll-snap:
	   one controller for scroll position instead of three fighting ones. */
	:global(html) {
		overflow-x: hidden;
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
	/* The one lobe with no region behind it — inert, and dimmed alongside the
	   others so it never reads as a target you failed to hit. */
	.brain-seg-static {
		pointer-events: none;
		opacity: 0.28;
	}
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

	/* Preview thumbnail on a CLOSED accordion row. Fixed box so every row is the
	   same height whether the item ships artwork or a lettered fallback. */
	.acc-thumb {
		height: 2.25rem;
		width: 3rem;
		flex-shrink: 0;
		border: 2px solid var(--color-charcoal);
		border-radius: 0.4rem;
		background: white;
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

	/* Every control in the pinned section opts out of text selection and of the
	   double-tap-zoom delay. These are tap targets, and a tap that drifts a pixel
	   was selecting their label instead of activating them — worse on the ‹ ›
	   arrows, where you tap repeatedly in the same spot. */
	.nav-arrow,
	:global(.brain-pane button) {
		-webkit-user-select: none;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}

	/* Region prev/next arrows (mobile section bar). */
	.nav-arrow {
		cursor: pointer;
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

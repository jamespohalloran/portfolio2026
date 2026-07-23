<script>
	// Master layout — wraps every page.
	// Pulls in the compiled Tailwind stylesheet exactly once for the whole app.
	import '../app.css';
	// Self-hosted brand font (variable, weights 200–1000). Registers the
	// 'Nunito Variable' family that --font-display in app.css points at.
	import '@fontsource-variable/nunito';
	import { page } from '$app/stores';

	// Single source of truth for the primary nav. `home` marks the exact-match
	// Home link; a `cta` flag marks Contact so it renders as the button.
	const nav = [
		{ label: 'Home', href: '/', home: true },
		// A REAL page, for the same reason About is one: the home page's brain
		// shows a featured few inside a pinned, scroll-driven section, and that's
		// no place to browse an archive. /#projects still works and still lands on
		// the brain's Projects lobe — it's just no longer what the nav points at.
		{ label: 'Projects', href: '/projects' },
		// About is a REAL page. It deliberately isn't `/#about`: a hash link has
		// to land inside the pinned, scroll-snapped brain section's coordinate
		// space, where the snap engine competes for the same scroll — a route
		// navigation sidesteps that entirely. The home page keeps its short About
		// blurb; this is the long version.
		{ label: 'About', href: '/about' },
		{ label: 'Blog', href: '/blog' },
		{ label: 'Contact', href: '/contact', cta: true }
	];

	// Active-path test. Home matches only exactly (and only with no hash, so the
	// in-page #projects link owns that state); hash links match the hash;
	// sections match their prefix so /projects/foo still lights up Projects.
	$: isActive = (href) => {
		if (href.startsWith('/#')) return $page.url.pathname === '/' && $page.url.hash === href.slice(1);
		if (href === '/') return $page.url.pathname === '/' && !$page.url.hash;
		return $page.url.pathname.startsWith(href);
	};

	// The home hero is full-bleed under the (overlay) header, so it needs no top
	// clearance. Every other page does, to sit below the fixed header.
	$: isHome = $page.url.pathname === '/';

	// On a phone the home page is crammed once you zoom into the brain, so the
	// availability banner earns its 40px only in the hero. Past a bit of scroll
	// it slides up out of the way and the header slides up into its place. This
	// is purely cosmetic here — the brain's own park geometry already treats the
	// banner as absent on mobile (see parkCy in +page.svelte), so nothing jumps.
	let innerWidth = 0;
	let innerHeight = 0;
	let scrollY = 0;
	$: bannerCollapsed =
		isHome && innerWidth > 0 && innerWidth < 768 && scrollY > innerHeight * 0.35;
</script>

<svelte:window bind:innerWidth bind:innerHeight bind:scrollY />

<!-- Subtle pastel background gradient sits behind the whole site. -->
<div
	class="flex min-h-full flex-col overflow-x-clip bg-gradient-to-b from-cream via-cream to-cream-deep"
>
	<!-- Home-only availability banner: a thin mint bar pinned to the very top,
	     overlaying the top edge of the full-bleed hero. -->
	{#if isHome}
		<div
			class="fixed inset-x-0 top-0 z-50 border-b-[3px] border-charcoal bg-temporal py-2 text-center transition-transform duration-300 ease-bouncy {bannerCollapsed
				? '-translate-y-full'
				: ''}"
		>
			<span class="text-sm font-bold tracking-wide text-charcoal">
				[ Available for Freelance / Hire ]
			</span>
		</div>
	{/if}

	<!-- Persistent, overlay, ultra-minimal header. Fixed (not sticky) so it
	     doesn't reserve layout space above the full-bleed home hero. On home it
	     sits just below the availability banner. -->
	<header
		class="fixed inset-x-0 z-40 overflow-x-clip backdrop-blur-md transition-[top] duration-300 ease-bouncy {isHome &&
		!bannerCollapsed
			? 'top-10'
			: 'top-0'}"
	>
		<nav
			class="mx-auto flex max-w-5xl items-center justify-center gap-0.5 px-2 py-3 sm:gap-3 sm:px-4"
		>
			{#each nav as item (item.href)}
				{#if item.cta}
					<!-- Contact renders as the one chunky cartoon button -->
					<a href={item.href} class="btn-cartoon ml-0.5 !px-3 text-sm sm:ml-1 sm:!px-5 sm:text-base">
						{item.label}
					</a>
				{:else}
					<a
						href={item.href}
						aria-current={isActive(item.href) ? 'page' : undefined}
						class="rounded-full px-2 py-1.5 text-sm font-bold transition-colors duration-300 ease-bouncy sm:px-3 sm:text-base
							{isActive(item.href)
							? 'bg-charcoal text-cream'
							: 'text-charcoal/70 hover:text-charcoal'}"
					>
						{item.label}
					</a>
				{/if}
			{/each}
		</nav>
	</header>

	<!-- Page content. Non-home pages get top padding to clear the fixed header;
	     the home hero fills to the very top. -->
	<!-- overflow-x-clip contains the home hero/brain when they're scaled up
	     during the zoom, so nothing forces a horizontal scrollbar / body shift.
	     (clip, not hidden, so it doesn't turn `main` into a scroll container and
	     break the sticky pin.) -->
	<main class="flex-1 overflow-x-clip {isHome ? '' : 'pt-16'}">
		<slot />
	</main>
</div>

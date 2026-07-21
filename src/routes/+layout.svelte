<script>
	// Master layout — wraps every page.
	// Pulls in the compiled Tailwind stylesheet exactly once for the whole app.
	import '../app.css';
	import { page } from '$app/stores';

	// Single source of truth for the primary nav. `home` marks the exact-match
	// Home link; a `cta` flag marks Contact so it renders as the button.
	const nav = [
		{ label: 'Home', href: '/', home: true },
		{ label: 'Projects', href: '/projects' },
		{ label: 'About', href: '/about' },
		{ label: 'Blog', href: '/blog' },
		{ label: 'Contact', href: '/contact', cta: true }
	];

	// Active-path test. Home matches only exactly; sections match their prefix
	// so /projects/foo still lights up the Projects link.
	$: isActive = (href) =>
		href === '/' ? $page.url.pathname === '/' : $page.url.pathname.startsWith(href);

	// The home hero is full-bleed under the (overlay) header, so it needs no top
	// clearance. Every other page does, to sit below the fixed header.
	$: isHome = $page.url.pathname === '/';
</script>

<!-- Subtle pastel background gradient sits behind the whole site. -->
<div
	class="flex min-h-full flex-col overflow-x-clip bg-gradient-to-b from-cream via-cream to-cream-deep"
>
	<!-- Persistent, overlay, ultra-minimal header. Fixed (not sticky) so it
	     doesn't reserve layout space above the full-bleed home hero. -->
	<header class="fixed inset-x-0 top-0 z-50 overflow-x-clip backdrop-blur-md">
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

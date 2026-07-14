<script>
	// Master layout — wraps every page.
	// Pulls in the compiled Tailwind stylesheet exactly once for the whole app.
	import '../app.css';
	import { page } from '$app/stores';

	// Single source of truth for the primary nav. The "Brain" entry is the
	// home page; a `cta` flag marks Contact so it renders as the button.
	const nav = [
		{ label: 'About', href: '/about' },
		{ label: 'Projects', href: '/projects' },
		{ label: 'Brain', href: '/', home: true },
		{ label: 'Experience', href: '/experience' },
		{ label: 'Blog', href: '/blog' },
		{ label: 'Contact', href: '/contact', cta: true }
	];

	// Active-path test. Home matches only exactly; sections match their prefix
	// so /projects/foo still lights up the Projects link.
	$: isActive = (href) =>
		href === '/' ? $page.url.pathname === '/' : $page.url.pathname.startsWith(href);
</script>

<!-- Subtle pastel background gradient sits behind the whole site. -->
<div
	class="flex min-h-full flex-col bg-gradient-to-b from-cream via-cream to-cream-deep"
>
	<!-- Persistent, sticky, ultra-minimal header -->
	<header class="sticky top-0 z-50 backdrop-blur-md">
		<nav
			class="mx-auto flex max-w-5xl items-center justify-center gap-1 px-4 py-3 sm:gap-3"
		>
			{#each nav as item (item.href)}
				{#if item.cta}
					<!-- Contact renders as the one chunky cartoon button -->
					<a href={item.href} class="btn-cartoon ml-1 text-sm sm:text-base">
						{item.label}
					</a>
				{:else}
					<a
						href={item.href}
						aria-current={isActive(item.href) ? 'page' : undefined}
						class="rounded-full px-3 py-1.5 text-sm font-bold transition-colors duration-300 ease-bouncy sm:text-base
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

	<!-- Page content -->
	<main class="flex-1">
		<slot />
	</main>
</div>

<!-- /blog — the full post archive (Temporal Lobe). -->
<script>
	import { posts } from '$lib/posts';
	import { formatDate } from '$lib/formatDate';
</script>

<svelte:head>
	<title>Blog · James O'Halloran</title>
	<meta
		name="description"
		content="Thoughts on software design, personal projects, and occasional life stuff."
	/>
</svelte:head>

<section class="mx-auto max-w-3xl px-6 py-20 sm:py-28">
	<div class="flex items-center gap-3">
		<span class="h-4 w-4 rounded-full bg-temporal ring-[3px] ring-charcoal"></span>
		<span class="text-xs font-bold uppercase tracking-widest text-charcoal-soft">Writing</span>
	</div>
	<h1 class="mt-4 text-4xl font-extrabold tracking-tight text-charcoal sm:text-5xl">
		Thoughts on software, games &amp; the occasional life stuff
	</h1>
	<p class="mt-4 max-w-2xl text-lg text-charcoal-soft">
		Hopefully there are smaller gaps between posts going forward 🤞
	</p>

	<ul class="mt-12 flex flex-col gap-5">
		{#each posts as post (post.slug)}
			<li>
				<a
					href="/blog/{post.slug}"
					class="group block rounded-cartoon border-[3px] border-charcoal bg-white p-6 shadow-cartoon transition-transform duration-300 ease-bouncy hover:-translate-y-1"
				>
					<time
						datetime={post.date}
						class="text-xs font-bold uppercase tracking-widest text-charcoal-soft"
					>
						{formatDate(post.date)}
					</time>
					<h2 class="mt-2 text-2xl font-extrabold text-charcoal">{post.title}</h2>
					<p class="mt-2 text-charcoal-soft">{post.description}</p>
					<span class="mt-4 inline-flex items-center gap-1 font-bold text-charcoal">
						Read article <span class="transition-transform group-hover:translate-x-1">→</span>
					</span>
				</a>
			</li>
		{/each}
	</ul>
</section>

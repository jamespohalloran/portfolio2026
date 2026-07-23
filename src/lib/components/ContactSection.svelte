<script>
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	// Contact section — the cartoon "speech bubble" form from the mockup.
	// Posts to the /api/contact Pages Function, which verifies Turnstile and
	// sends the message via Cloudflare Email Sending (see functions/api/contact.js).

	// Public Turnstile site key. Injected at build time from the Pages build
	// environment; safe to expose (the secret half lives only on the Function).
	const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY;

	let status = 'idle'; // idle | submitting | success | error
	let errorMsg = '';
	let token = ''; // Turnstile response token
	let widgetEl; // <div> the widget renders into
	let widgetId; // handle returned by turnstile.render(), used to reset()

	onMount(() => {
		if (!TURNSTILE_SITEKEY) return; // widget not configured yet — form will no-op server-side

		const render = () => {
			if (!window.turnstile || !widgetEl) return;
			widgetId = window.turnstile.render(widgetEl, {
				sitekey: TURNSTILE_SITEKEY,
				// Stay invisible and run the challenge silently; only surface a
				// visible box on the rare occasion a human interaction is needed.
				appearance: 'interaction-only',
				callback: (t) => (token = t),
				'expired-callback': () => (token = ''),
				'error-callback': () => (token = '')
			});
		};

		if (window.turnstile) {
			render();
		} else {
			const s = document.createElement('script');
			s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
			s.async = true;
			s.defer = true;
			s.onload = render;
			document.head.appendChild(s);
		}
	});

	async function onSubmit(event) {
		event.preventDefault();
		if (status === 'submitting') return;

		const fd = new FormData(event.currentTarget);
		const payload = {
			name: String(fd.get('name') ?? '').trim(),
			email: String(fd.get('email') ?? '').trim(),
			message: String(fd.get('message') ?? '').trim(),
			company: fd.get('company') ?? '', // honeypot — humans never see this
			token
		};

		if (!payload.name || !payload.email || !payload.message) {
			status = 'error';
			errorMsg = 'Please fill in your name, email, and message.';
			return;
		}
		if (TURNSTILE_SITEKEY && !token) {
			status = 'error';
			errorMsg = 'The anti-spam check didn’t complete — please try again.';
			return;
		}

		status = 'submitting';
		errorMsg = '';
		try {
			const res = await fetch(`${base}/api/contact`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const json = await res.json().catch(() => ({}));
			if (res.ok && json.ok) {
				status = 'success';
				event.target.reset();
			} else {
				status = 'error';
				errorMsg = json.error || 'Something went wrong. Please email me directly.';
			}
		} catch {
			status = 'error';
			errorMsg = 'Network error — please email me directly.';
		} finally {
			// A Turnstile token is single-use; reset so a retry gets a fresh one.
			token = '';
			if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
		}
	}
</script>

<section id="contact" class="bg-[#f7f1da] px-6 py-20 sm:py-28">
	<div class="mx-auto max-w-4xl">
		<h2
			class="text-center text-3xl font-extrabold uppercase tracking-tight text-charcoal sm:text-4xl"
		>
			Want something cool built?
		</h2>

		<div class="mt-12 flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-6">
			<!-- Illustrated portrait cut-out beside the speech bubble. -->
			<div class="shrink-0">
				<img
					src="{base}/james-avatar.svg"
					alt="Illustrated portrait of James O'Halloran"
					class="h-48 w-auto object-contain object-bottom"
				/>
			</div>

			<!-- Speech-bubble form -->
			<div class="bubble relative w-full">
				{#if status === 'success'}
					<div
						class="rounded-cartoon border-[3px] border-charcoal bg-white p-6 text-center shadow-cartoon sm:p-8"
					>
						<p class="text-2xl font-extrabold text-charcoal">Message sent! 🎉</p>
						<p class="mt-2 text-charcoal-soft">
							Thanks for reaching out — I'll get back to you soon.
						</p>
					</div>
				{:else}
					<form
						class="rounded-cartoon border-[3px] border-charcoal bg-white p-6 shadow-cartoon sm:p-8"
						on:submit={onSubmit}
					>
						<label class="block">
							<span class="text-sm font-extrabold text-charcoal">Name</span>
							<input
								type="text"
								name="name"
								placeholder="Your name"
								required
								class="field mt-1.5"
							/>
						</label>

						<label class="mt-4 block">
							<span class="text-sm font-extrabold text-charcoal">Email</span>
							<input
								type="email"
								name="email"
								placeholder="you@example.com"
								required
								class="field mt-1.5"
							/>
						</label>

						<label class="mt-4 block">
							<span class="text-sm font-extrabold text-charcoal">Message</span>
							<textarea
								name="message"
								rows="4"
								placeholder="What are you working on?"
								required
								class="field mt-1.5 resize-y"
							></textarea>
						</label>

						<!-- Honeypot: hidden from humans, catnip for bots. Must stay empty. -->
						<div class="hp" aria-hidden="true">
							<label>
								Company
								<input type="text" name="company" tabindex="-1" autocomplete="off" />
							</label>
						</div>

						<!-- Turnstile renders here (invisible/managed challenge). -->
						<div bind:this={widgetEl} class="mt-5"></div>

						{#if status === 'error'}
							<p class="mt-3 text-sm font-bold text-red-600">{errorMsg}</p>
						{/if}

						<button
							type="submit"
							class="btn-cartoon mt-6 !bg-temporal"
							disabled={status === 'submitting'}
						>
							{status === 'submitting' ? 'Sending…' : 'Contact'}
						</button>
					</form>
				{/if}
			</div>
		</div>

		<!-- The escape hatch from the form, deliberately OUTSIDE the speech
		     bubble: inside, it competed with the fields for the same visual
		     container. Some people would simply rather use their own mail
		     client. -->
		<p class="mt-8 text-center text-sm text-charcoal-soft">
			…or email me at
			<a
				href="mailto:james.ohalloran@mightypebble.com"
				class="font-bold text-charcoal underline decoration-frontal decoration-2 underline-offset-4 hover:decoration-charcoal"
			>
				james.ohalloran@mightypebble.com
			</a>
		</p>
	</div>
</section>

<style>
	/* Shared field styling for the inputs + textarea. */
	.field {
		width: 100%;
		border-radius: 0.9rem;
		border: 3px solid var(--color-charcoal);
		background: var(--color-cream);
		padding: 0.6rem 0.85rem;
		font-weight: 600;
		color: var(--color-charcoal);
		transition: box-shadow 0.2s ease;
	}
	.field::placeholder {
		color: var(--color-charcoal-soft);
		opacity: 0.6;
		font-weight: 500;
	}
	.field:focus {
		outline: none;
		box-shadow: var(--shadow-cartoon-sm);
	}

	/* Honeypot — visually gone and out of the tab order, but present in the DOM
	   so bots that auto-fill every field give themselves away. */
	.hp {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}

	/* Speech-bubble tail pointing left toward the avatar (desktop only). */
	.bubble::before {
		content: '';
		position: absolute;
		left: -18px;
		top: 60px;
		width: 0;
		height: 0;
		border-top: 12px solid transparent;
		border-bottom: 12px solid transparent;
		border-right: 20px solid var(--color-charcoal);
		display: none;
	}
	.bubble::after {
		content: '';
		position: absolute;
		left: -12px;
		top: 62px;
		width: 0;
		height: 0;
		border-top: 9px solid transparent;
		border-bottom: 9px solid transparent;
		border-right: 16px solid white;
		display: none;
	}
	@media (min-width: 768px) {
		.bubble::before,
		.bubble::after {
			display: block;
		}
	}
</style>

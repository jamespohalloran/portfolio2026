<script>
	import { base } from '$app/paths';

	// Contact section — the cartoon "speech bubble" form from the mockup.
	// Purely presentational for now: the form is not wired to a backend, so
	// submitting is a no-op (preventDefault) until an endpoint is added.
	function onSubmit(event) {
		event.preventDefault();
		// TODO: wire up to a form handler / email service.
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
							class="field mt-1.5"
						/>
					</label>

					<label class="mt-4 block">
						<span class="text-sm font-extrabold text-charcoal">Email</span>
						<input type="email" name="email" placeholder="you@example.com" class="field mt-1.5" />
					</label>

					<label class="mt-4 block">
						<span class="text-sm font-extrabold text-charcoal">Message</span>
						<textarea
							name="message"
							rows="4"
							placeholder="What strange stuff should we build?"
							class="field mt-1.5 resize-y"
						></textarea>
					</label>

					<button type="submit" class="btn-cartoon mt-6 !bg-temporal">Contact</button>
				</form>
			</div>
		</div>
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

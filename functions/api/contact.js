/**
 * POST /api/contact — Cloudflare Pages Function backing the contact form.
 *
 * Why this exists: the site is a 100% static SvelteKit build (adapter-static),
 * so there is no server at runtime to receive form posts. Cloudflare Pages
 * Functions give us a tiny Worker alongside the static assets. Pages Functions
 * do NOT support the `send_email` binding (only Workers do), so we send through
 * the Email Sending REST API with a scoped API token instead.
 *
 * Flow: validate → honeypot → Turnstile siteverify → send email (reply-to the
 * visitor so a plain "Reply" reaches them).
 *
 * Required environment (set in the Pages project → Settings → Variables):
 *   Secrets:
 *     CF_EMAIL_TOKEN   Cloudflare API token with the "Send Email" permission.
 *     TURNSTILE_SECRET Secret key of the Turnstile widget.
 *   Plain vars:
 *     CF_ACCOUNT_ID    Cloudflare account id that owns the sending domain.
 *     CONTACT_TO       Inbox that receives submissions.
 *     CONTACT_FROM     Verified sender address on an onboarded domain.
 */

const MAX = { name: 200, email: 320, message: 5000 };

function json(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json; charset=utf-8' }
	});
}

// Deliberately loose — real validation is "does the reply bounce", but this
// catches obvious garbage before we spend an email send on it.
function looksLikeEmail(v) {
	return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= MAX.email;
}

async function verifyTurnstile(secret, token, ip) {
	const form = new FormData();
	form.append('secret', secret);
	form.append('response', token);
	if (ip) form.append('remoteip', ip);
	const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		body: form
	});
	const data = await res.json().catch(() => ({ success: false }));
	return data.success === true;
}

export async function onRequestPost({ request, env }) {
	// Fail loudly (in logs) if the project isn't configured, but don't leak which
	// piece is missing to the client.
	for (const key of ['CF_ACCOUNT_ID', 'CF_EMAIL_TOKEN', 'CONTACT_TO', 'CONTACT_FROM', 'TURNSTILE_SECRET']) {
		if (!env[key]) {
			console.error(`contact form misconfigured: ${key} is not set`);
			return json({ ok: false, error: 'The contact form is not configured yet.' }, 500);
		}
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid request.' }, 400);
	}

	const name = String(body.name ?? '').trim();
	const email = String(body.email ?? '').trim();
	const message = String(body.message ?? '').trim();
	const honeypot = String(body.company ?? '').trim();
	const token = String(body.token ?? '');

	// Honeypot: a hidden field no human sees. If it's filled, it's a bot. Return
	// a 200 "success" so the bot has no signal to adapt to — just never send.
	if (honeypot) {
		return json({ ok: true });
	}

	if (!name || !message) {
		return json({ ok: false, error: 'Please fill in your name and message.' }, 400);
	}
	if (!looksLikeEmail(email)) {
		return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
	}
	if (name.length > MAX.name || message.length > MAX.message) {
		return json({ ok: false, error: 'That message is a little too long.' }, 400);
	}

	if (!token) {
		return json({ ok: false, error: 'Please complete the anti-spam check.' }, 400);
	}
	const humanVerified = await verifyTurnstile(
		env.TURNSTILE_SECRET,
		token,
		request.headers.get('CF-Connecting-IP')
	);
	if (!humanVerified) {
		return json({ ok: false, error: 'Anti-spam check failed. Please try again.' }, 400);
	}

	// Plain-text body first (best deliverability), with a light HTML twin.
	const safe = (s) =>
		s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
	const text = `New message from the johalloran.dev contact form\n\nName: ${name}\nEmail: ${email}\n\n${message}\n`;
	const html =
		`<p><strong>New message from the johalloran.dev contact form</strong></p>` +
		`<p><strong>Name:</strong> ${safe(name)}<br>` +
		`<strong>Email:</strong> <a href="mailto:${safe(email)}">${safe(email)}</a></p>` +
		`<p style="white-space:pre-wrap">${safe(message)}</p>`;

	const payload = {
		to: env.CONTACT_TO,
		from: { address: env.CONTACT_FROM, name: `${name} (via johalloran.dev)` },
		reply_to: { address: email, name },
		subject: `Portfolio contact — ${name}`,
		text,
		html
	};

	const res = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/email/sending/send`,
		{
			method: 'POST',
			headers: {
				authorization: `Bearer ${env.CF_EMAIL_TOKEN}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify(payload)
		}
	);

	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		console.error(`email send failed (${res.status}): ${detail}`);
		return json({ ok: false, error: 'Could not send your message. Please email me directly.' }, 502);
	}

	return json({ ok: true });
}

// Pages Functions auto-respond 405 for any method without a handler, so
// exporting only onRequestPost is enough — GET/PUT/etc. get Method Not Allowed.

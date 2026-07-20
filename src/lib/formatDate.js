// Render an ISO date string (YYYY-MM-DD) as e.g. "6 July 2026".
// Pinned to UTC so the displayed day never drifts with the viewer's timezone.
export function formatDate(dateString) {
	return new Date(`${dateString}T00:00:00Z`).toLocaleDateString('en-US', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});
}

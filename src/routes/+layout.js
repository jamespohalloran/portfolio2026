// Prerender EVERY route as static HTML at build time.
//
// Declaring this once at the root layout cascades to all child routes, so the
// entire site — home, /about, /projects, /experience, /blog, /contact —
// compiles to flat static files with zero server runtime. This is what makes
// the adapter-static / Cloudflare Pages deploy work.
export const prerender = true;

// No client-side router fallback needed for a fully-prerendered multi-page site.
export const ssr = true;
export const csr = true;

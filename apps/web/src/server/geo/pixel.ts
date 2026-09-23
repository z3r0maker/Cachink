/**
 * The landing beacon's response (N-58, ADR-092).
 *
 * A 1×1 transparent GIF. The marketing site is prerendered static HTML with no
 * server of its own, so the count is taken by an `<img>` request to the portal
 * rather than by a function in that project — which would otherwise need a
 * database URL and a role, a new secret in the one project whose virtue is
 * holding none.
 *
 * An `<img>` also fires when the React bundle never hydrates or is blocked,
 * needs no CORS preflight, and cannot set a cookie. Nothing here issues an
 * identifier — no cookie, no ETag, no Last-Modified — so there is nothing to
 * correlate one visit with the next.
 *
 * Kept apart from the route so it can be tested without a request.
 */

/** The smallest transparent GIF: 42 bytes, `GIF89a`, one pixel. */
export const PIXEL_BYTES = Uint8Array.from(
  atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
  (c) => c.charCodeAt(0),
);

export function pixelResponse(): Response {
  return new Response(PIXEL_BYTES, {
    status: 200,
    headers: {
      'content-type': 'image/gif',
      'content-length': String(PIXEL_BYTES.length),
      // Counted per visit, and never stored in a shared cache.
      'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
      // The beacon reveals nothing; say so rather than leaving it to a default.
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
    },
  });
}

/**
 * Security headers and Content-Security-Policy for both Next apps (SEC-WEB-01,
 * N-26). One implementation (CLAUDE.md §2.3): the console (`apps/backoffice`)
 * and the portal (`apps/web`) differ only in the options they pass.
 *
 * Plain ESM with a `.d.ts` beside it, because `next.config.mjs` imports it
 * before any TypeScript is compiled.
 */

/**
 * Headers for every response, static assets included.
 * @param {{ noindex?: boolean; referrer: string; permissions: string; hstsPreload?: boolean }} o
 */
export function securityHeaders(o) {
  return [
    ...(o.noindex
      ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' }]
      : []),
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: o.referrer },
    {
      key: 'Strict-Transport-Security',
      value: `max-age=63072000; includeSubDomains${o.hstsPreload ? '; preload' : ''}`,
    },
    { key: 'Permissions-Policy', value: o.permissions },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ];
}

/**
 * The per-request policy. Scripts run only with the request's nonce
 * (`'strict-dynamic'` lets them load Next's chunks), so an injected
 * `<script>` does nothing. `'unsafe-eval'` only in development, where React
 * needs it to rebuild server error stacks.
 *
 * @param {{
 *   nonce: string;
 *   isDev: boolean;
 *   wasm?: boolean;
 *   inlineStyleAttributes?: boolean;
 *   blobs?: boolean;
 *   workers?: boolean;
 *   formAction?: readonly string[];
 *   reportUri?: string;
 * }} o
 */
export function buildCsp(o) {
  const script = [`'self'`, `'nonce-${o.nonce}'`, `'strict-dynamic'`];
  if (o.wasm) script.push(`'wasm-unsafe-eval'`);
  if (o.isDev) script.push(`'unsafe-eval'`);
  const style = o.inlineStyleAttributes ? `'self' 'unsafe-inline'` : `'self' 'nonce-${o.nonce}'`;
  const directives = [
    `default-src 'self'`,
    `script-src ${script.join(' ')}`,
    `style-src ${style}`,
    `img-src 'self' data:${o.blobs ? ' blob:' : ''}`,
    `font-src 'self'`,
    `connect-src 'self'`,
    ...(o.workers ? [`worker-src 'self' blob:`, `manifest-src 'self'`] : []),
    `object-src 'none'`,
    `base-uri 'none'`,
    `form-action ${["'self'", ...(o.formAction ?? [])].join(' ')}`,
    `frame-ancestors 'none'`,
    ...(o.isDev ? [] : ['upgrade-insecure-requests']),
    ...(o.reportUri ? [`report-uri ${o.reportUri}`] : []),
  ];
  return directives.join('; ');
}

/** 128 random bits, base64 — unguessable and unique per request. */
export function newNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

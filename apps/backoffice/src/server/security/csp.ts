/**
 * The admin console's Content-Security-Policy, built per request.
 *
 * Scripts run only with this request's nonce (`'strict-dynamic'` lets those
 * scripts load Next's chunks), so an injected `<script>` does nothing. There
 * is no third-party origin at all: sign-in is the console's own (server
 * actions against Postgres), fonts come from the token stack, and the TOTP QR
 * code is rendered on the server as a `data:` SVG — hence `img-src data:`, and
 * nothing broader.
 *
 * `'unsafe-eval'` is added in development only, where React needs it to
 * rebuild server error stacks; production never has it.
 */
export function buildCsp(nonce: string, isDev: boolean): string {
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? ` 'unsafe-eval'` : ''}`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'none'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ];
  return directives.join('; ');
}

/** 128 random bits, base64 — unguessable and unique per request. */
export function newNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

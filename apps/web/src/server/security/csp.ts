import { buildCsp } from '@xangarro/config/security';

/**
 * The portal's Content-Security-Policy (SEC-WEB-01, N-26), through the shared
 * builder the console uses. What differs from the console, and why:
 *
 * - `'wasm-unsafe-eval'` and `worker-src 'self' blob:` — the browser register
 *   runs SQLite as WebAssembly in a module worker (ADR-071, `operador/runtime`),
 *   and the offline page is a service worker (N-23).
 * - `style-src 'unsafe-inline'` — the portal's components set inline `style`
 *   attributes, which a nonce cannot cover. Scripts stay nonce-only.
 * - `img-src blob:` — receipts and exports are drawn to canvas and downloaded.
 * - `form-action` Stripe — Checkout and the Customer Portal are reached by a
 *   redirect after a form post (B-10).
 *
 * Served **report-only** (`src/proxy.ts`): violations land in the log through
 * `/api/csp-report`, and the header name flips to enforcing once that log is
 * clean in production. A wrong policy on the register would stop sales.
 */
export const CSP_REPORT_PATH = '/api/csp-report';

export function portalCsp(nonce: string, isDev: boolean): string {
  return buildCsp({
    nonce,
    isDev,
    wasm: true,
    inlineStyleAttributes: true,
    blobs: true,
    workers: true,
    formAction: ['https://checkout.stripe.com', 'https://billing.stripe.com'],
    reportUri: CSP_REPORT_PATH,
  });
}

export interface SecurityHeader {
  readonly key: string;
  readonly value: string;
}
export function securityHeaders(o: {
  readonly noindex?: boolean;
  readonly referrer: string;
  readonly permissions: string;
  readonly hstsPreload?: boolean;
}): SecurityHeader[];
/** The policy for a response whose bytes somebody uploaded (audit F-01). */
export const UPLOADED_BYTES_CSP: string;
export function uploadedBytesHeaders(): {
  readonly 'Content-Security-Policy': string;
  readonly 'X-Content-Type-Options': 'nosniff';
};
export function buildCsp(o: {
  readonly nonce: string;
  readonly isDev: boolean;
  readonly wasm?: boolean;
  readonly inlineStyleAttributes?: boolean;
  readonly blobs?: boolean;
  readonly workers?: boolean;
  readonly formAction?: readonly string[];
  /** Origins the page may fetch from besides its own (the console's blob store, E-26). */
  readonly connect?: readonly string[];
  readonly reportUri?: string;
  /** `false` on a page served over plain http, where the upgrade breaks its own scripts. */
  readonly upgradeInsecure?: boolean;
}): string;
export function newNonce(): string;

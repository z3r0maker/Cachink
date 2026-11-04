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
}): string;
export function newNonce(): string;

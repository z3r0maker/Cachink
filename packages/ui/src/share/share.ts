/**
 * Share — cross-platform comprobante share API (P1C-M3-T04 part 2/2).
 *
 * Shared types + defaults. Platform implementations of `shareComprobante`
 * live in `./share.native.tsx` (React Native) and `./share.web.tsx`
 * (Tauri webview). Metro + Vite auto-pick the right variant.
 *
 * Keeps the surface intentionally tiny — one function that accepts a
 * ShareTarget, returns a Promise<ShareResult>. Implementation details
 * (PNG rasterization, WhatsApp intents, temp-file writing) are the
 * platform variant's responsibility.
 */

export interface ShareTarget {
  /** Short title surfaced by the OS share sheet ("Comprobante"). */
  readonly title: string;
  /** Plain-text body for apps that can't handle HTML (WhatsApp, SMS). */
  readonly text: string;
  /** Self-contained HTML document. Desktop shares as file when available. */
  readonly html: string;
  /** Optional filename stem (without extension) for temp-file fallbacks. */
  readonly filenameStem?: string;
}

export interface ShareResult {
  /** Whether the share actually completed (share sheet dismissed with action). */
  readonly shared: boolean;
  /** Method used — helps telemetry distinguish WhatsApp vs SMS vs download. */
  readonly method: 'native' | 'fallback' | 'cancelled';
}

/**
 * Default no-op used when no platform has registered an implementation.
 * The shared `share.ts` re-exports from `share.web.ts` which picks this
 * up unless Metro overrides with `share.native.ts`.
 */
export async function shareComprobanteFallback(target: ShareTarget): Promise<ShareResult> {
   
  console.warn('[shareComprobante] no platform implementation registered. Target:', target.title);
  return { shared: false, method: 'cancelled' };
}

/**
 * Share — shared types + fallback (no platform extension).
 *
 * Lives separately from `./share.ts` so the `share/index.ts` barrel
 * (and any future runtime consumer) can import `shareComprobanteFallback`
 * without Metro/Vite resolving back to a platform-extension file that
 * shadows the base. Importing `shareComprobanteFallback` from
 * `'./share'` on iOS resolves to `share.native.ts` (Metro picks
 * `.native.ts` over the bare `.ts`), and that file only exports
 * `shareComprobante` — the import would resolve to `undefined`.
 * Routing the shared exports through this `*.shared.ts` file is the
 * canonical Metro platform-extension fix (matches the icon /
 * database-backup / rasterize / notification-scheduler pattern).
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

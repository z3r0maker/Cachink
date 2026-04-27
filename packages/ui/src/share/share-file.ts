/**
 * Cross-platform binary-file share helper (Slice 3 C26). Handles the
 * Excel/PDF export flow — the existing `shareComprobante` accepts
 * HTML, this one takes a Blob (already produced by exceljs /
 * @react-pdf/renderer) and:
 *
 *   1. Tries `navigator.share({ files })` — modern browser + macOS.
 *   2. Falls back to a `<a download>` anchor click — works on Tauri
 *      WebView + any desktop environment.
 *
 * Mobile (Expo) swaps this via the platform-extension pattern once a
 * native-share variant is needed; Phase 1C ships the web/Tauri flow
 * first because that's where Settings export runs most.
 */

import type { ShareResult } from './share';

export interface ShareFileTarget {
  readonly title: string;
  readonly filename: string;
  readonly blob: Blob;
}

interface NavigatorShare {
  share?: (data: {
    readonly title?: string;
    readonly text?: string;
    readonly url?: string;
    readonly files?: readonly File[];
  }) => Promise<void>;
  canShare?: (data: { readonly files?: readonly File[] }) => boolean;
}

async function trySharedFile(nav: NavigatorShare, target: ShareFileTarget): Promise<boolean> {
  if (!nav.share || typeof nav.canShare !== 'function') return false;
  const file = new File([target.blob], target.filename, { type: target.blob.type });
  if (!nav.canShare({ files: [file] })) return false;
  await nav.share({ title: target.title, files: [file] });
  return true;
}

function downloadAnchor(target: ShareFileTarget): boolean {
  if (typeof document === 'undefined') return false;
  const url = URL.createObjectURL(target.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = target.filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

export async function shareFile(target: ShareFileTarget): Promise<ShareResult> {
  const nav = (typeof navigator !== 'undefined' ? navigator : ({} as Navigator)) as NavigatorShare;
  try {
    if (await trySharedFile(nav, target)) {
      return { shared: true, method: 'native' };
    }
    if (downloadAnchor(target)) {
      return { shared: true, method: 'fallback' };
    }
    return { shared: false, method: 'cancelled' };
  } catch {
    return { shared: false, method: 'cancelled' };
  }
}

/**
 * Share — Tauri / web variant (P1C-M3-T04 part 2/2, desktop).
 *
 * Strategy, in order of preference:
 *   1. `navigator.share({ files })` — macOS Monterey+, modern Chromium,
 *      Safari 16+. Gives the user the full OS share picker.
 *   2. `navigator.share({ text, url })` — same API without a file
 *      attachment. Covers older browsers that implement Web Share
 *      Level 1.
 *   3. Fallback: open an anchor `<a download>` with the HTML as a
 *      Blob. The user gets a saved file they can forward manually.
 *
 * No Tauri-plugin-fs / html2canvas dependencies — keeps the desktop
 * bundle minimal. Richer fallbacks land in a later phase if a user
 * flow demands them.
 */

import type { ShareResult, ShareTarget } from './share';

interface NavigatorShare {
  share?: (data: {
    readonly title?: string;
    readonly text?: string;
    readonly url?: string;
    readonly files?: readonly File[];
  }) => Promise<void>;
  canShare?: (data: { readonly files?: readonly File[] }) => boolean;
}

function filename(stem: string): string {
  return `${stem}.html`;
}

async function trySharedFiles(nav: NavigatorShare, target: ShareTarget): Promise<boolean> {
  if (!nav.share || typeof nav.canShare !== 'function') return false;
  const file = new File([target.html], filename(target.filenameStem ?? 'comprobante'), {
    type: 'text/html',
  });
  if (!nav.canShare({ files: [file] })) return false;
  await nav.share({ title: target.title, text: target.text, files: [file] });
  return true;
}

async function tryTextShare(nav: NavigatorShare, target: ShareTarget): Promise<boolean> {
  if (!nav.share) return false;
  await nav.share({ title: target.title, text: target.text });
  return true;
}

function downloadBlob(target: ShareTarget): void {
  const blob = new Blob([target.html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename(target.filenameStem ?? 'comprobante');
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function shareComprobante(target: ShareTarget): Promise<ShareResult> {
  const nav = (typeof navigator !== 'undefined' ? navigator : ({} as Navigator)) as NavigatorShare;
  try {
    if (await trySharedFiles(nav, target)) return { shared: true, method: 'native' };
    if (await tryTextShare(nav, target)) return { shared: true, method: 'native' };
    if (typeof document !== 'undefined') {
      downloadBlob(target);
      return { shared: true, method: 'fallback' };
    }
    return { shared: false, method: 'cancelled' };
  } catch {
    return { shared: false, method: 'cancelled' };
  }
}

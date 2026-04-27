/**
 * `rasterizeComprobante` — web / Tauri variant.
 *
 * Renders the comprobante HTML into a hidden DOM container then
 * captures it with `html2canvas`. PDF format wraps the resulting
 * canvas in a `jspdf` document at the canvas's natural size. Both
 * libraries are **dynamic-imported** so they don't land in the
 * cold-start bundle (matches the existing `useExportarDatos` lazy-load
 * pattern from Slice 4 C20).
 *
 * **Why a hidden container instead of the existing iframe.**
 * `html2canvas` traverses live DOM; iframes with restrictive sandbox
 * flags are opaque to it. The hidden-container approach also keeps
 * the rasterize step pure — it doesn't depend on the preview frame
 * having mounted, so callers can rasterize without rendering the
 * preview at all (useful for headless export later).
 *
 * **Sandbox parity.** The container reuses the same browser DOM that
 * Tauri renders comprobantes inside, so the rasterized image matches
 * what the user sees on the desktop preview pixel-for-pixel.
 *
 * Vite-based tools resolve this file via the default import chain
 * `./rasterize.ts → ./rasterize.web.ts`. Metro picks
 * `./rasterize.native.ts` on mobile.
 */

import type { RasterizeOptions, RasterizedBlob } from './rasterize.shared';
import { DEFAULT_FILENAME_STEM, DEFAULT_RASTERIZE_WIDTH } from './rasterize.shared';

interface Html2CanvasFn {
  (element: HTMLElement, options?: Record<string, unknown>): Promise<HTMLCanvasElement>;
}

interface JsPDFInstance {
  addImage: (data: string, format: string, x: number, y: number, w: number, h: number) => unknown;
  output: (type: 'blob') => Blob;
}

interface JsPDFCtor {
  new (options: Record<string, unknown>): JsPDFInstance;
}

async function loadHtml2Canvas(): Promise<Html2CanvasFn> {
  const mod = (await import('html2canvas')) as { default?: Html2CanvasFn } & Html2CanvasFn;
  // html2canvas ships as both default and CJS namespace; normalise.
  const fn = (mod.default ?? mod) as Html2CanvasFn;
  return fn;
}

async function loadJsPDF(): Promise<JsPDFCtor> {
  const mod = (await import('jspdf')) as { jsPDF?: JsPDFCtor; default?: JsPDFCtor };
  const ctor = mod.jsPDF ?? mod.default;
  if (!ctor) {
    throw new Error('jspdf module did not expose a constructor');
  }
  return ctor;
}

/**
 * Build a hidden container, inject the HTML, run html2canvas, then
 * tear the container down. Caller is guaranteed the DOM is restored
 * even if the rasterize step throws.
 */
async function captureHtml(html: string, width: number): Promise<HTMLCanvasElement> {
  if (typeof document === 'undefined') {
    throw new Error('rasterizeComprobante.web requires a DOM');
  }
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'comprobante-rasterize-host');
  container.style.cssText = `position:absolute;left:-99999px;top:0;width:${width}px;background:#ffffff;`;
  container.innerHTML = html;
  document.body.append(container);
  try {
    const html2canvas = await loadHtml2Canvas();
    return await html2canvas(container, {
      backgroundColor: '#ffffff',
      useCORS: true,
      // Tamagui + Plus Jakarta Sans render at 1× DPR on Tauri's WebView
      // by default; force scale=2 for crisp WhatsApp shares.
      scale: 2,
    });
  } finally {
    container.remove();
  }
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) {
        reject(new Error('canvas.toBlob returned null'));
        return;
      }
      resolve(b);
    }, 'image/png');
  });
}

async function rasterizePng(canvas: HTMLCanvasElement, stem: string): Promise<RasterizedBlob> {
  const blob = await canvasToPngBlob(canvas);
  return {
    blob,
    contentType: 'image/png',
    extension: 'png',
    filename: `${stem}.png`,
  };
}

async function rasterizePdf(canvas: HTMLCanvasElement, stem: string): Promise<RasterizedBlob> {
  const JsPDF = await loadJsPDF();
  const pdf = new JsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
  const blob = pdf.output('blob');
  return {
    blob,
    contentType: 'application/pdf',
    extension: 'pdf',
    filename: `${stem}.pdf`,
  };
}

export async function rasterizeComprobante(opts: RasterizeOptions): Promise<RasterizedBlob> {
  const format = opts.format ?? 'png';
  const width = opts.width ?? DEFAULT_RASTERIZE_WIDTH;
  const stem = opts.filenameStem ?? DEFAULT_FILENAME_STEM;
  const canvas = await captureHtml(opts.html, width);
  if (format === 'pdf') {
    return rasterizePdf(canvas, stem);
  }
  return rasterizePng(canvas, stem);
}

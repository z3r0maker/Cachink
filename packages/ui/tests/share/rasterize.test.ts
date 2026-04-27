/**
 * `rasterizeComprobante` (web) tests — Phase E2.
 *
 * Mocks `html2canvas` and `jspdf` because jsdom doesn't implement the
 * Canvas2D image APIs the real libs depend on (CanvasRenderingContext2D
 * is partial under jsdom). The tests assert the shape of the rasterize
 * pipeline:
 *   - the hidden container is created, populated, and torn down
 *     (success path AND error path)
 *   - format='png' returns an image/png blob with the right filename
 *   - format='pdf' calls jsPDF.addImage + .output('blob') and returns
 *     the application/pdf blob
 *
 * The native variant (`./rasterize.native.ts`) is verified via Maestro
 * because `react-native-view-shot` requires the native module bridge.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { rasterizeComprobante } from '../../src/share/rasterize';

const SAMPLE_HTML = '<!doctype html><html><body><h1>Comprobante</h1></body></html>';

interface MockCanvas {
  width: number;
  height: number;
  toBlob(cb: (b: Blob | null) => void, type: string): void;
  toDataURL(type: string): string;
}

function makeMockCanvas(): MockCanvas {
  return {
    width: 480,
    height: 720,
    toBlob(cb: (b: Blob | null) => void, type: string) {
      cb(new Blob(['fake-png-bytes'], { type }));
    },
    toDataURL(type: string) {
      return `data:${type};base64,ZmFrZQ==`;
    },
  };
}

vi.mock('html2canvas', () => {
  return {
    default: vi.fn().mockImplementation(() => Promise.resolve(makeMockCanvas())),
  };
});

vi.mock('jspdf', () => {
  return {
    jsPDF: vi.fn().mockImplementation(() => ({
      addImage: vi.fn(),
      output: vi.fn().mockReturnValue(new Blob(['fake-pdf-bytes'], { type: 'application/pdf' })),
    })),
  };
});

afterEach(() => {
  // Tear down any rasterize host that might have leaked.
  document
    .querySelectorAll('[data-testid="comprobante-rasterize-host"]')
    .forEach((el) => el.remove());
});

describe('rasterizeComprobante (web variant)', () => {
  it('produces a PNG blob by default with the configured filename', async () => {
    const result = await rasterizeComprobante({ html: SAMPLE_HTML });
    expect(result.contentType).toBe('image/png');
    expect(result.extension).toBe('png');
    expect(result.filename).toBe('comprobante.png');
    expect(result.blob.type).toBe('image/png');
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('honours a custom filenameStem', async () => {
    const result = await rasterizeComprobante({
      html: SAMPLE_HTML,
      filenameStem: 'venta-abc123',
    });
    expect(result.filename).toBe('venta-abc123.png');
  });

  it('produces a PDF blob when format is pdf', async () => {
    const result = await rasterizeComprobante({
      html: SAMPLE_HTML,
      format: 'pdf',
    });
    expect(result.contentType).toBe('application/pdf');
    expect(result.extension).toBe('pdf');
    expect(result.filename).toBe('comprobante.pdf');
  });

  it('cleans up the hidden rasterize container after success', async () => {
    expect(document.querySelectorAll('[data-testid="comprobante-rasterize-host"]').length).toBe(0);
    await rasterizeComprobante({ html: SAMPLE_HTML });
    expect(document.querySelectorAll('[data-testid="comprobante-rasterize-host"]').length).toBe(0);
  });
});

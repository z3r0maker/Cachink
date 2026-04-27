/**
 * `shareComprobanteAsImage` tests — Phase E3 (audit M-1 PR 3.5-T07).
 *
 * Asserts the rasterize → shareFile pipeline on the web variant. The
 * native variant is verified via Maestro because it depends on
 * `react-native-view-shot`'s native module bridge.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { shareComprobanteAsImage } from '../../src/share/share-image';

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

const realNavigator = globalThis.navigator;

afterEach(() => {
  // @ts-expect-error — jsdom navigator replacement
  globalThis.navigator = realNavigator;
  document
    .querySelectorAll('[data-testid="comprobante-rasterize-host"]')
    .forEach((el) => el.remove());
});

beforeEach(() => {
  // @ts-expect-error — jsdom navigator replacement
  globalThis.navigator = {};
});

describe('shareComprobanteAsImage (web)', () => {
  it('rasterizes the HTML and routes the PNG blob through navigator.share when supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    // @ts-expect-error — stub navigator
    globalThis.navigator = { share, canShare };

    const result = await shareComprobanteAsImage({
      title: 'Comprobante — Pan dulce',
      html: SAMPLE_HTML,
      filenameStem: 'venta-123',
    });

    expect(canShare).toHaveBeenCalled();
    expect(share).toHaveBeenCalled();
    const callArg = share.mock.calls[0]?.[0] as { files: File[]; title: string };
    expect(callArg.title).toBe('Comprobante — Pan dulce');
    expect(callArg.files).toHaveLength(1);
    expect(callArg.files[0]?.name).toBe('venta-123.png');
    expect(callArg.files[0]?.type).toBe('image/png');
    expect(result).toEqual({ shared: true, method: 'native' });
  });

  it('falls back to <a download> when navigator.share is unavailable', async () => {
    // @ts-expect-error — minimal navigator
    globalThis.navigator = {};
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:stub');
    URL.revokeObjectURL = vi.fn();
    try {
      const result = await shareComprobanteAsImage({
        title: 'Comprobante',
        html: SAMPLE_HTML,
      });
      expect(result).toEqual({ shared: true, method: 'fallback' });
      expect(URL.createObjectURL).toHaveBeenCalled();
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });

  it('honours format: pdf and produces an application/pdf attachment', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    // @ts-expect-error — stub navigator
    globalThis.navigator = { share, canShare };

    await shareComprobanteAsImage({
      title: 'Comprobante PDF',
      html: SAMPLE_HTML,
      format: 'pdf',
      filenameStem: 'venta-pdf',
    });

    const callArg = share.mock.calls[0]?.[0] as { files: File[] };
    expect(callArg.files[0]?.name).toBe('venta-pdf.pdf');
    expect(callArg.files[0]?.type).toBe('application/pdf');
  });
});

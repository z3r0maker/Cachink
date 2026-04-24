/**
 * Unit tests for the desktop (web) share variant (P1C-M3-T04 part 2/2).
 *
 * The mobile variant depends on React Native's Share module which is
 * not resolvable in jsdom; its behaviour is tested via the Maestro
 * E2E flow in Commit 17. Desktop paths are the high-leverage ones to
 * exercise here since every fallback branch (file / text / download /
 * failure) matters for the real Cachink user.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  shareComprobante,
  shareComprobanteFallback,
  type ShareTarget,
} from '../../src/share/index';

const target: ShareTarget = {
  title: 'Comprobante',
  text: 'Gracias por tu compra',
  html: '<!doctype html><html><body>ok</body></html>',
  filenameStem: 'venta-123',
};

describe('shareComprobanteFallback', () => {
  it('returns a cancelled result and logs a warning', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await shareComprobanteFallback(target);
    expect(result).toEqual({ shared: false, method: 'cancelled' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('shareComprobante (web)', () => {
  const realNavigator = globalThis.navigator;

  afterEach(() => {
    // @ts-expect-error — jsdom navigator replacement
    globalThis.navigator = realNavigator;
  });

  beforeEach(() => {
    // @ts-expect-error — jsdom navigator replacement
    globalThis.navigator = {};
  });

  it('uses navigator.share with a file when canShare allows it', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    // @ts-expect-error — stub navigator
    globalThis.navigator = { share, canShare };
    const result = await shareComprobante(target);
    expect(canShare).toHaveBeenCalled();
    expect(share).toHaveBeenCalled();
    expect(result).toEqual({ shared: true, method: 'native' });
  });

  it('falls back to text-only navigator.share when file-share is not allowed', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(false);
    // @ts-expect-error — stub navigator
    globalThis.navigator = { share, canShare };
    const result = await shareComprobante(target);
    expect(canShare).toHaveBeenCalled();
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'Comprobante' }));
    expect(result).toEqual({ shared: true, method: 'native' });
  });

  it('falls back to blob download when navigator.share is unavailable', async () => {
    // @ts-expect-error — stub minimal navigator without share
    globalThis.navigator = {};
    // Stub URL.createObjectURL (not provided by jsdom).
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:stub');
    URL.revokeObjectURL = vi.fn();
    try {
      const result = await shareComprobante(target);
      expect(result).toEqual({ shared: true, method: 'fallback' });
      expect(URL.createObjectURL).toHaveBeenCalled();
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });

  it('returns cancelled when navigator.share throws', async () => {
    const share = vi.fn().mockRejectedValue(new Error('user cancelled'));
    const canShare = vi.fn().mockReturnValue(true);
    // @ts-expect-error — stub navigator
    globalThis.navigator = { share, canShare };
    const result = await shareComprobante(target);
    expect(result).toEqual({ shared: false, method: 'cancelled' });
  });
});

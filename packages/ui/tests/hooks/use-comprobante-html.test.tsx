/**
 * useComprobanteHtml hook tests.
 */
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { makeSale } from '@cachink/testing';
import type { Business, BusinessId, DeviceId, IsoTimestamp } from '@cachink/domain';
import { DEFAULT_FEATURE_FLAGS } from '@cachink/domain';
import { useComprobanteHtml } from '../../src/hooks/use-comprobante-html';
import { initI18n } from '../../src/i18n/index';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';

initI18n();

const BUSINESS: Business = {
  id: '01HZ8XQN9GZJXV8AKQ5X0C7B01' as BusinessId,
  nombre: 'Taquería Don Pedro',
  regimenFiscal: 'RIF',
  isrTasa: 3000,
  logoUrl: null,
  featureFlags: JSON.stringify(DEFAULT_FEATURE_FLAGS),
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7B01' as BusinessId,
  deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId,
  createdByUserId: null,
  createdAt: '2026-04-23T15:00:00.000Z' as IsoTimestamp,
  updatedAt: '2026-04-23T15:00:00.000Z' as IsoTimestamp,
  deletedAt: null,
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      {children}
    </TamaguiProvider>
  );
}

describe('useComprobanteHtml', () => {
  it('returns null when sale is null', () => {
    const { result } = renderHook(() => useComprobanteHtml(null, BUSINESS), { wrapper });
    expect(result.current).toBeNull();
  });

  it('returns null when business is null', () => {
    const sale = makeSale({ monto: 5000n });
    const { result } = renderHook(() => useComprobanteHtml(sale, null), { wrapper });
    expect(result.current).toBeNull();
  });

  it('returns HTML string when both sale and business are provided', () => {
    const sale = makeSale({ monto: 5000n, concepto: 'Taco al pastor' });
    const { result } = renderHook(() => useComprobanteHtml(sale, BUSINESS), { wrapper });
    expect(result.current).toContain('Taquería Don Pedro');
    expect(typeof result.current).toBe('string');
  });
});

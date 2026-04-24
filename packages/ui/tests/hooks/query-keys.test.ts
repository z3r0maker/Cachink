/**
 * Query-key contract tests (Slice 2 C29).
 *
 * Guardrail: make sure the dependent-key set for pago invalidation
 * matches what our existing queries subscribe to. This prevents the
 * 'I invalidated but nothing refreshed' class of bug.
 */

import { describe, expect, it } from 'vitest';
import type { BusinessId, ClientId, IsoDate } from '@cachink/domain';
import { clienteKeys, cxcKeys, pagoKeys, ventaKeys } from '../../src/hooks/query-keys';

const biz = '01JPHK00000000000000000008' as BusinessId;
const cliente = '01JPHK0000000000000000C001' as ClientId;
const fecha = '2026-04-24' as IsoDate;

describe('query keys', () => {
  it('venta.byDate composes as [ventas, businessId, fecha]', () => {
    expect(ventaKeys.byDate(biz, fecha)).toEqual(['ventas', biz, fecha]);
  });

  it('venta.byBusiness prefixes ventas', () => {
    expect(ventaKeys.byBusiness(biz)[0]).toBe('ventas');
  });

  it('cliente.detail composes as [cliente-detail, businessId, id]', () => {
    expect(clienteKeys.detail(biz, cliente)).toEqual(['cliente-detail', biz, cliente]);
  });

  it('cxc.byBusiness prefixes cuentasPorCobrar', () => {
    expect(cxcKeys.byBusiness(biz)[0]).toBe('cuentasPorCobrar');
  });

  it('pagoKeys.dependentsForBusiness includes ventas + cxc + cliente-detail prefixes', () => {
    const keys = pagoKeys.dependentsForBusiness(biz);
    const prefixes = keys.map((k) => k[0]);
    expect(prefixes).toContain('ventas');
    expect(prefixes).toContain('cuentasPorCobrar');
    expect(prefixes).toContain('cliente-detail');
  });
});

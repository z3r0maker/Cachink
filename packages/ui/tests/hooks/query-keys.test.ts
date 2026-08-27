/**
 * Query-key contract tests (Slice 2 C29).
 *
 * Guardrail: make sure the dependent-key set for pago invalidation
 * matches what our existing queries subscribe to. This prevents the
 * 'I invalidated but nothing refreshed' class of bug.
 */

import { describe, expect, it } from 'vitest';
import type { BusinessId, ClientId, IsoDate } from '@cachink/domain';
import { clienteKeys, cxcKeys, estadosKeys, pagoKeys, ventaKeys } from '../../src/hooks/query-keys';

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

  describe('estadosKeys.dependentsForBusiness', () => {
    it('covers all four derived Estados surfaces', () => {
      const prefixes = estadosKeys.dependentsForBusiness(biz).map((k) => k[0]);
      expect(prefixes).toEqual([
        'estado-resultados',
        'balance-general',
        'flujo-efectivo',
        'indicadores',
      ]);
    });

    it('returns prefixes that match every cached period of the real query keys', () => {
      // Guardrail: a dependent key only invalidates a live query if it
      // is a true prefix of that query's key. If someone reorders the
      // estados key tuples, this test fails instead of the app going
      // silently stale.
      const from = '2026-04-01';
      const to = '2026-04-30';
      const live = [
        estadosKeys.resultados(biz, from, to),
        estadosKeys.balance(biz, from, to),
        estadosKeys.flujo(biz, from, to),
        estadosKeys.indicadores(biz, from, to),
      ];
      const deps = estadosKeys.dependentsForBusiness(biz);

      for (const [i, key] of live.entries()) {
        const dep = deps[i];
        expect(dep).toBeDefined();
        expect(key.slice(0, dep!.length)).toEqual([...dep!]);
      }
    });

    it('scopes to the business so another business is not swept', () => {
      const other = '01JPHK00000000000000000009' as BusinessId;
      const deps = estadosKeys.dependentsForBusiness(biz);
      expect(deps.every((k) => k[1] === biz)).toBe(true);
      expect(deps.some((k) => k[1] === other)).toBe(false);
    });

    it('tolerates a null businessId before hydration', () => {
      expect(estadosKeys.dependentsForBusiness(null)).toHaveLength(4);
    });
  });
});

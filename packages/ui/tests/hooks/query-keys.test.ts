import { describe, expect, it } from 'vitest';

import {
  cajaKeys,
  clienteKeys,
  corteKeys,
  cxcKeys,
  estadosKeys,
  flagKeys,
  frequentProductosKeys,
  pagoKeys,
  syncKeys,
  userKeys,
  ventaKeys,
} from '../../src/hooks/query-keys';

/**
 * The key factories are the contract that keeps queries and invalidations
 * from drifting (C29): a mutation that invalidates the wrong prefix looks
 * perfectly green in tests and silently serves stale screens. Every key is
 * pinned to its exact tuple — including the dependents lists, whose whole
 * point is that a write sweeps every surface that reads it.
 */

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BUS' as never;
const FECHA = '2026-09-28' as never;

describe('query-key factories', () => {
  it('ventas and clientes', () => {
    expect(ventaKeys.all).toEqual(['ventas']);
    expect(ventaKeys.byBusiness(BIZ)).toEqual(['ventas', BIZ]);
    expect(ventaKeys.byDate(BIZ, FECHA)).toEqual(['ventas', BIZ, FECHA]);
    expect(clienteKeys.all).toEqual(['clients']);
    expect(clienteKeys.byBusiness(null)).toEqual(['clients', null]);
    expect(clienteKeys.detail(BIZ, 'c-1')).toEqual(['cliente-detail', BIZ, 'c-1']);
  });

  it('a pago lands on ventas, cuentas por cobrar and the cliente detail', () => {
    expect(pagoKeys.dependentsForBusiness(BIZ)).toEqual([
      ['ventas', BIZ],
      ['cuentasPorCobrar', BIZ],
      ['cliente-detail', BIZ],
    ]);
    expect(cxcKeys.byBusiness(BIZ)).toEqual(['cuentasPorCobrar', BIZ]);
  });

  it('a corte closes the day, the history, the expected cash and the balance', () => {
    expect(corteKeys.delDia(BIZ)).toEqual(['corte-del-dia', BIZ]);
    expect(corteKeys.historial(BIZ)).toEqual(['corte-historial', BIZ]);
    expect(corteKeys.efectivoEsperado(BIZ, FECHA)).toEqual(['efectivo-esperado', BIZ, FECHA]);
    expect(corteKeys.dependentsForBusiness(BIZ)).toEqual([
      ['corte-del-dia', BIZ],
      ['corte-historial', BIZ],
      ['efectivo-esperado', BIZ],
      ['balance-general', BIZ],
    ]);
  });

  it('estados keys are period-scoped, but a write sweeps every period at once', () => {
    expect(estadosKeys.resultados(BIZ, 'a', 'b')).toEqual(['estado-resultados', BIZ, 'a', 'b']);
    expect(estadosKeys.balance(BIZ, 'a', 'b')).toEqual(['balance-general', BIZ, 'a', 'b']);
    expect(estadosKeys.flujo(BIZ, 'a', 'b')).toEqual(['flujo-efectivo', BIZ, 'a', 'b']);
    expect(estadosKeys.indicadores(BIZ, 'a', 'b')).toEqual(['indicadores', BIZ, 'a', 'b']);
    expect(estadosKeys.dependentsForBusiness(BIZ)).toEqual([
      ['estado-resultados', BIZ],
      ['balance-general', BIZ],
      ['flujo-efectivo', BIZ],
      ['indicadores', BIZ],
    ]);
  });

  it('products, users, caja and flags', () => {
    expect(frequentProductosKeys.byBusiness(BIZ, 30)).toEqual(['frequentProductos', BIZ, 30]);
    expect(userKeys.all).toEqual(['users']);
    expect(userKeys.byBusiness(BIZ)).toEqual(['users', BIZ]);
    expect(cajaKeys.byBusiness(BIZ)).toEqual(['caja', BIZ]);
    expect(cajaKeys.openByUser(BIZ)).toEqual(['caja-open', BIZ]);
    expect(flagKeys.business).toEqual(['currentBusiness']);
  });

  it('sync keys, including the retired LAN role kept for residual invalidations', () => {
    expect(syncKeys.conflicts(10)).toEqual(['sync-conflicts', 10]);
    expect(syncKeys.lanAuth()).toEqual(['sync-lan-auth']);
    expect(syncKeys.lanRole()).toEqual(['sync-lan-role']);
    expect(syncKeys.lanHostReady()).toEqual(['sync-lan-host-ready']);
    expect(syncKeys.pendingChanges()).toEqual(['sync-pending-changes']);
  });
});

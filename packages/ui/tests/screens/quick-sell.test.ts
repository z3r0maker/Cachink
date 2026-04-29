/**
 * Quick-sell helper tests (ADR-048 — product-only sales).
 */

import { describe, expect, it } from 'vitest';
import type { BusinessId, IsoDate } from '@cachink/domain';
import { makeProduct } from '../../../testing/src/fixtures/product';
import { makeBusiness } from '../../../testing/src/fixtures/business';
import { deriveVentaCategoria, buildQuickSellPayload } from '../../src/screens/Ventas/quick-sell';

const BIZ = makeBusiness({
  id: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId,
  categoriaVentaPredeterminada: 'Producto',
});

describe('deriveVentaCategoria', () => {
  it('returns Servicio when producto.tipo is servicio', () => {
    const p = makeProduct({ tipo: 'servicio', seguirStock: false });
    expect(deriveVentaCategoria(p, BIZ)).toBe('Servicio');
  });

  it('returns Producto when producto.tipo is producto', () => {
    const p = makeProduct({ tipo: 'producto' });
    expect(deriveVentaCategoria(p, BIZ)).toBe('Producto');
  });
});

describe('buildQuickSellPayload', () => {
  it('builds a NewSale from a Product tap', () => {
    const p = makeProduct({ nombre: 'Taco', precioVentaCentavos: 4500n });
    const payload = buildQuickSellPayload({
      producto: p,
      business: BIZ,
      fecha: '2026-04-28' as IsoDate,
    });
    expect(payload.concepto).toBe('Taco');
    expect(payload.monto).toBe(4500n);
    expect(payload.categoria).toBe('Producto');
    expect(payload.metodo).toBe('Efectivo');
    expect(payload.productoId).toBe(p.id);
    expect(payload.cantidad).toBe(1);
  });

  it('uses the provided metodo override', () => {
    const p = makeProduct();
    const payload = buildQuickSellPayload({
      producto: p,
      business: BIZ,
      fecha: '2026-04-28' as IsoDate,
      metodo: 'Tarjeta',
    });
    expect(payload.metodo).toBe('Tarjeta');
  });

  it('maps servicio producto to Servicio categoria', () => {
    const p = makeProduct({ tipo: 'servicio', seguirStock: false });
    const payload = buildQuickSellPayload({
      producto: p,
      business: BIZ,
      fecha: '2026-04-28' as IsoDate,
    });
    expect(payload.categoria).toBe('Servicio');
  });
});

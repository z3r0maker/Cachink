/**
 * Fullstack scenario 3 — Crédito lifecycle.
 *
 * Business narrative:
 *   1. Create a client
 *   2. Register a credit sale → estadoPago=pendiente
 *   3. Make a partial payment → estadoPago=parcial
 *   4. Overpayment → rejected
 *   5. Complete payment → estadoPago=pagado
 *   6. Payment on non-credit sale → rejected
 *   7. Payment on already-paid sale → rejected
 *
 * Covers: CXC-01 through CXC-06
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ClientId, ProductId, SaleId, UserId } from '@cachink/domain';
import { newEntityId } from '@cachink/domain';
import {
  makeNewBusiness,
  makeNewProduct,
  makeNewSale,
} from '../../../testing/src/index.js';
import { buildHarness, type FullstackHarness } from './fullstack-harness.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER_ID = newEntityId<UserId>();

describe('Crédito Lifecycle [fullstack]', () => {
  let h: FullstackHarness;
  let clientId: ClientId;
  let productId: ProductId;

  beforeEach(async () => {
    h = buildHarness({ userId: USER_ID, stockEnabled: false });

    await h.repos.businesses.create(makeNewBusiness({ businessId: BIZ }));

    // Seed product (non-stock for simplicity)
    const product = await h.repos.products.create(
      makeNewProduct({
        businessId: BIZ,
        seguirStock: false,
        precioVentaCentavos: 100_00n,
      }),
    );
    productId = product.id;

    // Seed client
    const client = await h.repos.clients.create({
      nombre: 'Laura Hernández',
      telefono: '3312345678',
      businessId: BIZ,
    });
    clientId = client.id;

    // Open caja (required for sales)
    await h.useCases.abrirCaja.execute({
      userId: USER_ID,
      fecha: '2026-04-23',
      montoAperturaCentavos: 500_00n,
      efectivoAdicionalCentavos: 0n,
      businessId: BIZ,
    });
  });

  it('credit sale starts as pendiente', async () => {
    const sale = await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        monto: 100_00n,
        metodo: 'Crédito',
        clienteId: clientId,
      }),
    );

    expect(sale.estadoPago).toBe('pendiente');
    expect(sale.metodo).toBe('Crédito');
    expect(sale.clienteId).toBe(clientId);
  });

  it('partial payment updates estadoPago to parcial', async () => {
    const sale = await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        monto: 100_00n,
        metodo: 'Crédito',
        clienteId: clientId,
      }),
    );

    // Pay 60 of 100
    const pago = await h.useCases.registrarPago.execute({
      ventaId: sale.id,
      fecha: '2026-04-23',
      montoCentavos: 60_00n,
      metodo: 'Efectivo',
      businessId: BIZ,
    });

    expect(pago.montoCentavos).toBe(60_00n);

    // Verify venta is now parcial
    const updated = await h.repos.sales.findById(sale.id);
    expect(updated!.estadoPago).toBe('parcial');
  });

  it('overpayment is rejected', async () => {
    const sale = await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        monto: 100_00n,
        metodo: 'Crédito',
        clienteId: clientId,
      }),
    );

    // Pay 60 first
    await h.useCases.registrarPago.execute({
      ventaId: sale.id,
      fecha: '2026-04-23',
      montoCentavos: 60_00n,
      metodo: 'Efectivo',
      businessId: BIZ,
    });

    // Try to pay 50 more — total would be 110 > 100
    await expect(
      h.useCases.registrarPago.execute({
        ventaId: sale.id,
        fecha: '2026-04-24',
        montoCentavos: 50_00n,
        metodo: 'Efectivo',
        businessId: BIZ,
      }),
    ).rejects.toThrow(/excede.*monto/i);
  });

  it('complete payment marks sale as pagado', async () => {
    const sale = await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        monto: 100_00n,
        metodo: 'Crédito',
        clienteId: clientId,
      }),
    );

    // Pay 60 + 40 = 100
    await h.useCases.registrarPago.execute({
      ventaId: sale.id,
      fecha: '2026-04-23',
      montoCentavos: 60_00n,
      metodo: 'Efectivo',
      businessId: BIZ,
    });

    await h.useCases.registrarPago.execute({
      ventaId: sale.id,
      fecha: '2026-04-24',
      montoCentavos: 40_00n,
      metodo: 'Transferencia',
      businessId: BIZ,
    });

    const final = await h.repos.sales.findById(sale.id);
    expect(final!.estadoPago).toBe('pagado');
  });

  it('payment on non-credit sale is rejected', async () => {
    // Cash sale
    const cashSale = await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        monto: 50_00n,
        metodo: 'Efectivo',
      }),
    );

    await expect(
      h.useCases.registrarPago.execute({
        ventaId: cashSale.id,
        fecha: '2026-04-23',
        montoCentavos: 50_00n,
        metodo: 'Efectivo',
        businessId: BIZ,
      }),
    ).rejects.toThrow(/solo ventas en crédito/i);
  });

  it('payment on already-paid sale is rejected', async () => {
    const sale = await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        monto: 100_00n,
        metodo: 'Crédito',
        clienteId: clientId,
      }),
    );

    // Pay in full
    await h.useCases.registrarPago.execute({
      ventaId: sale.id,
      fecha: '2026-04-23',
      montoCentavos: 100_00n,
      metodo: 'Efectivo',
      businessId: BIZ,
    });

    // Try another payment
    await expect(
      h.useCases.registrarPago.execute({
        ventaId: sale.id,
        fecha: '2026-04-24',
        montoCentavos: 10_00n,
        metodo: 'Efectivo',
        businessId: BIZ,
      }),
    ).rejects.toThrow(/ya está pagada/i);
  });
});

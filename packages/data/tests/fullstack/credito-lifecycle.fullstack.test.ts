/**
 * Fullstack scenario 3 — Crédito lifecycle.
 *
 * Business narrative:
 *   1. Create a client
 *   2. Register a credit sale → estadoPago=pendiente
 *   3. Record a client abono (ADR-074: per client; the sale's estadoPago no
 *      longer flips here — balances are derived by estadoDeCuenta)
 *   4. Overpayment → rejected
 *   5. Complete payment → estadoPago=pagado
 *   6. Payment on non-credit sale → rejected
 *   7. Payment on already-paid sale → rejected
 *
 * Covers: CXC-01 through CXC-06
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ClientId, ProductId, UserId } from '@xangarro/domain';
import { newEntityId } from '@xangarro/domain';
import { makeNewBusiness, makeNewProduct, makeNewSale } from '../../../testing/src/index.js';
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

    const ticket = await h.repos.tickets.findById(sale.ticketId);
    expect(ticket?.estadoPago).toBe('pendiente');
    expect(ticket?.metodo).toBe('Crédito');
    expect(ticket?.clienteId).toBe(clientId);
  });

  it('findCreditoByClient keeps the whole fiado history, oldest first', async () => {
    const primera = await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        monto: 100_00n,
        metodo: 'Crédito',
        clienteId: clientId,
      }),
    );
    await new Promise((r) => setTimeout(r, 3));
    const segunda = await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        monto: 100_00n,
        metodo: 'Crédito',
        clienteId: clientId,
      }),
    );
    // A cash sale and another client's fiado must not leak into the account.
    await h.useCases.registrarVenta.execute(
      makeNewSale({ businessId: BIZ, productoId: productId, monto: 50_00n }),
    );
    const otro = await h.repos.clients.create({ nombre: 'Otro', telefono: '1', businessId: BIZ });
    await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        monto: 70_00n,
        metodo: 'Crédito',
        clienteId: otro.id,
      }),
    );

    const historial = await h.repos.tickets.findCreditoByClient(clientId);
    expect(historial.map((t) => t.id)).toEqual([primera.ticketId, segunda.ticketId]);
    // Even fully settled tickets stay in the history (ADR-074).
    await h.repos.tickets.updatePaymentState(primera.ticketId, 'pagado');
    expect(await h.repos.tickets.findCreditoByClient(clientId)).toHaveLength(2);
  });

  it('records a client abono without touching the sale (ADR-074)', async () => {
    const sale = await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        monto: 100_00n,
        metodo: 'Crédito',
        clienteId: clientId,
      }),
    );

    // Abono 60 of 100 — it belongs to the client, not the sale
    const pago = await h.useCases.registrarPago.execute({
      clienteId: clientId,
      fecha: '2026-04-23',
      montoCentavos: 60_00n,
      metodo: 'Efectivo',
      businessId: BIZ,
    });

    expect(pago.montoCentavos).toBe(60_00n);
    expect(pago.clienteId).toBe(clientId);

    const abonos = await h.repos.clientPayments.findByCliente(clientId);
    expect(abonos.map((a) => a.montoCentavos)).toEqual([60_00n]);
    void sale;
  });

  it('an abono above the balance is recorded whole — the excess is saldo a favor (ADR-083 D5)', async () => {
    await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        monto: 100_00n,
        metodo: 'Crédito',
        clienteId: clientId,
      }),
    );

    await h.useCases.registrarPago.execute({
      clienteId: clientId,
      fecha: '2026-04-23',
      montoCentavos: 60_00n,
      metodo: 'Efectivo',
      businessId: BIZ,
    });

    // 50 more: 110 against a 100 balance — the cash is in the drawer
    const pago = await h.useCases.registrarPago.execute({
      clienteId: clientId,
      fecha: '2026-04-24',
      montoCentavos: 50_00n,
      metodo: 'Efectivo',
      businessId: BIZ,
    });
    expect(pago.montoCentavos).toBe(50_00n);
  });

  it('abonos accumulate on the client account (ADR-074)', async () => {
    await h.useCases.registrarVenta.execute(
      makeNewSale({
        businessId: BIZ,
        productoId: productId,
        monto: 100_00n,
        metodo: 'Crédito',
        clienteId: clientId,
      }),
    );

    // 60 + 40 = 100 — the derived balance is zero, nothing stored flipped
    await h.useCases.registrarPago.execute({
      clienteId: clientId,
      fecha: '2026-04-23',
      montoCentavos: 60_00n,
      metodo: 'Efectivo',
      businessId: BIZ,
    });

    await h.useCases.registrarPago.execute({
      clienteId: clientId,
      fecha: '2026-04-24',
      montoCentavos: 40_00n,
      metodo: 'Transferencia',
      businessId: BIZ,
    });

    const abonos = await h.repos.clientPayments.findByCliente(clientId);
    expect(abonos.map((a) => a.montoCentavos)).toEqual([60_00n, 40_00n]);
  });

  it('an abono for an unknown client is rejected', async () => {
    await expect(
      h.useCases.registrarPago.execute({
        clienteId: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never,
        fecha: '2026-04-23',
        montoCentavos: 50_00n,
        metodo: 'Efectivo',
        businessId: BIZ,
      }),
    ).rejects.toThrow(/no existe/i);
  });

  it('a zero abono is rejected', async () => {
    await expect(
      h.useCases.registrarPago.execute({
        clienteId: clientId,
        fecha: '2026-04-23',
        montoCentavos: 0n,
        metodo: 'Efectivo',
        businessId: BIZ,
      }),
    ).rejects.toThrow();
  });
});

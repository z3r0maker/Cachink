/**
 * The sale as one ticket and its comprobante (Track M, M-07; MvVentaHecha):
 * the use-case input, what «Venta hecha» shows, and the receipt text.
 */
import { describe, expect, it } from 'vitest';
import type { BusinessId, ClientId } from '@xangarro/domain';
import { makeBusiness } from '../../../../testing/src/fixtures/business';
import {
  comprobanteSvgDe,
  comprobanteTexto,
  marcaDe,
  pagoTexto,
} from '../../../src/screens/Checkout/comprobante';
import { ticketInput, ventaHechaDe } from '../../../src/screens/Checkout/use-cobrar-ticket';
import type { VentaHecha } from '../../../src/screens/Checkout/venta-hecha';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const lines = [
  {
    productoId: '01HZ8XQN9GZJXV8AKQ5X0C7BJA',
    nombre: 'Taco de pastor',
    precio: 25_00n,
    cantidad: 3,
  },
  { productoId: '01HZ8XQN9GZJXV8AKQ5X0C7BJB', nombre: 'Gringa', precio: 60_00n, cantidad: 1 },
];

describe('ticketInput', () => {
  it('makes one ticket with every line and the cash received', () => {
    const i = ticketInput({ lines, metodo: 'Efectivo', recibido: 200_00n }, BIZ);
    expect(i.ticket.metodo).toBe('Efectivo');
    expect(i.ticket.efectivoRecibidoCentavos).toBe(200_00n);
    expect(i.ticket.clienteId).toBeNull();
    expect(i.lineas.map((l) => [l.monto, l.cantidad])).toEqual([
      [75_00n, 3],
      [60_00n, 1],
    ]);
  });

  it('puts fiado on the client as Crédito, with no cash', () => {
    const cliente = {
      id: '01HZ8XQN9GZJXV8AKQ5X0C7BJC' as ClientId,
      nombre: 'Doña Mari',
      saldo: 340_00n,
    };
    const i = ticketInput({ lines, metodo: 'Fiado', recibido: 500_00n, cliente }, BIZ);
    expect(i.ticket.metodo).toBe('Crédito');
    expect(i.ticket.clienteId).toBe(cliente.id);
    expect(i.ticket.efectivoRecibidoCentavos).toBeNull();
  });
});

describe('ventaHechaDe', () => {
  const r = { ticket: { id: 't1', folio: 413, hora: '14:58', cambioCentavos: 65_00n }, lineas: [] };

  it('carries the folio, the change and what was handed over', () => {
    const v = ventaHechaDe({ lines, metodo: 'Efectivo', recibido: 200_00n }, r as never);
    expect(v).toMatchObject({ folio: 'V-0413', total: 135_00n, recibido: 200_00n, cambio: 65_00n });
  });

  it('adds the sale to the client’s balance for fiado', () => {
    const cliente = { id: 'c' as ClientId, nombre: 'Doña Mari', saldo: 340_00n };
    const v = ventaHechaDe({ lines, metodo: 'Fiado', recibido: null, cliente }, r as never);
    expect(v).toMatchObject({ cliente: 'Doña Mari', saldoCliente: 475_00n, cambio: null });
  });
});

describe('comprobante', () => {
  const venta: VentaHecha = {
    ticketId: 't1',
    folio: 'V-0413',
    hora: '14:58',
    lines,
    total: 135_00n,
    metodo: 'Efectivo',
    recibido: 200_00n,
    cambio: 65_00n,
    cliente: null,
    saldoCliente: null,
  };
  const negocio = makeBusiness({ nombre: 'Taquería Don Pedro', receiptLeyenda: null });

  it('reads as the web caja’s receipt text', () => {
    const t = comprobanteTexto(venta, marcaDe(negocio), new Date(2026, 8, 27));
    expect(t.split('\n').slice(0, 5)).toEqual([
      'Taquería Don Pedro',
      'Venta V-0413 · 27 de septiembre de 2026, 14:58 h',
      '',
      '3 x Taco de pastor $75.00',
      '1 x Gringa $60.00',
    ]);
    expect(t).toContain('Efectivo: $200.00 · Cambio: $65.00');
    expect(t).toContain('Este documento no es un comprobante fiscal (CFDI).');
    expect(t).not.toContain('—');
  });

  it('says whose account a fiado went to', () => {
    expect(
      pagoTexto({ ...venta, metodo: 'Fiado', recibido: null, cambio: null, cliente: 'Doña Mari' }),
    ).toBe('A cuenta de: Doña Mari');
    expect(pagoTexto({ ...venta, metodo: 'Tarjeta', recibido: null, cambio: null })).toBe(
      'Tarjeta: $135.00',
    );
  });

  it('renders the business template as SVG', () => {
    expect(comprobanteSvgDe(venta, negocio)).toMatch(/^<svg/);
  });
});

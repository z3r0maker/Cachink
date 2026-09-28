/**
 * Ventas del turno (Track M, M-08; MvVentas): one row per ticket with its
 * lines grouped, the sheet's ticket, the comprobante and the cancel wording.
 */
import { describe, expect, it } from 'vitest';
import type { Sale, Ticket } from '@xangarro/domain';
import { fichas, resumen } from '@xangarro/caja/ventas';
import {
  avisoCancelada,
  comprobanteDe,
  conceptoDe,
  detalleDeTicket,
  motivoCompleto,
  ventaDeTicket,
  type TicketLeido,
} from '../../../src/screens/VentasTurno/ventas-lectura';

function ticket(over: Partial<Ticket> = {}): Ticket {
  return {
    id: '01HZ8XQN9GZJXV8AKQ5X0C7T01',
    folio: 412,
    fecha: '2026-09-28',
    hora: '14:52',
    concepto: 'Taco de pastor',
    metodo: 'Efectivo',
    clienteId: null,
    estadoPago: 'pagado',
    efectivoRecibidoCentavos: 200_00n,
    cambioCentavos: 40_00n,
    cajaTurnoId: null,
    cancelMotivo: null,
    cancelledByUserId: null,
    cancelledAt: null,
    businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
    deviceId: '01HZ8XQN9GZJXV8AKQ5X0C7D01',
    createdByUserId: null,
    createdAt: '2026-09-28T20:52:00.000Z',
    updatedAt: '2026-09-28T20:52:00.000Z',
    deletedAt: null,
    ...over,
  } as Ticket;
}

function linea(concepto: string, cantidad: number, monto: bigint, n: number): Sale {
  return {
    id: `01HZ8XQN9GZJXV8AKQ5X0C7S0${n}`,
    ticketId: '01HZ8XQN9GZJXV8AKQ5X0C7T01',
    fecha: '2026-09-28',
    concepto,
    categoria: 'Producto',
    monto,
    productoId: `01HZ8XQN9GZJXV8AKQ5X0C7P0${n}`,
    cantidad,
  } as Sale;
}

const LINEAS = [linea('Taco de pastor', 3, 75_00n, 1), linea('Gringa', 1, 60_00n, 2)];
const leido = (over: Partial<TicketLeido> = {}): TicketLeido => ({
  ticket: ticket(),
  lineas: LINEAS,
  cliente: null,
  capturo: 'Ana Robledo',
  ...over,
});

describe('ventaDeTicket', () => {
  it('groups the lines under one folio and sums them', () => {
    const v = ventaDeTicket(leido());
    expect(v.folio).toBe('V-0412');
    expect(v.concepto).toBe('3 Taco de pastor · 1 Gringa');
    expect(v.monto).toBe(135_00n);
    expect(v.metodo).toBe('Efectivo');
    expect(v.cancelada).toBeUndefined();
  });

  it('says Fiado for Crédito and names the client', () => {
    const v = ventaDeTicket(
      leido({ ticket: ticket({ metodo: 'Crédito' }), cliente: { nombre: 'Doña Mari' } }),
    );
    expect(v.metodo).toBe('Fiado');
    expect(v.cliente).toBe('Doña Mari');
  });

  it('keeps a cancelled ticket visible with its motive, counting nowhere', () => {
    const v = ventaDeTicket(leido({ ticket: ticket({ cancelMotivo: 'Cobré de más' }) }));
    expect(v.cancelada).toEqual({ motivo: 'Cobré de más' });
    expect(resumen([v, ventaDeTicket(leido())])).toMatchObject({
      activas: 1,
      cobrado: 135_00n,
      canceladas: 1,
    });
  });

  it('reads a migrated ticket without an hour from when it was written', () => {
    expect(ventaDeTicket(leido({ ticket: ticket({ hora: null }) })).hora).toMatch(/^\d{2}:\d{2}$/);
  });

  it('writes nothing for no lines', () => {
    expect(conceptoDe([])).toBe('');
  });
});

describe('detalleDeTicket', () => {
  it('prices each line and shows the change the operator gave', () => {
    const d = detalleDeTicket(leido(), '2026-09-28');
    expect(d.cuando).toBe('Hoy 14:52');
    expect(d.lineas.map((l) => [l.nombre, l.precio, l.cantidad])).toEqual([
      ['Taco de pastor', 25_00n, 3],
      ['Gringa', 60_00n, 1],
    ]);
    const f = fichas(d, { operador: 'Ana', caja: 'Caja 1', desde: '08:15' });
    expect(f.slice(0, 3).map((x) => x.v)).toEqual(['$200.00', '$65.00', 'Ana Robledo']);
  });

  it('tells a ticket from another day by its date', () => {
    expect(detalleDeTicket(leido(), '2026-09-29').cuando).toBe('2026-09-28 14:52');
  });

  it('carries what the fiado client owes now', () => {
    const d = detalleDeTicket(
      leido({
        ticket: ticket({ metodo: 'Crédito', efectivoRecibidoCentavos: null }),
        cliente: { nombre: 'Doña Mari', saldo: 340_00n },
      }),
      '2026-09-28',
    );
    expect(d.fiado).toEqual({ cliente: 'Doña Mari', saldo: 340_00n });
    expect(d.recibido).toBeUndefined();
  });
});

describe('comprobanteDe', () => {
  it('hands M-07 the lines, the cash and the change', () => {
    const c = comprobanteDe(leido());
    expect(c.total).toBe(135_00n);
    expect(c.recibido).toBe(200_00n);
    expect(c.cambio).toBe(40_00n);
    expect(c.lines[0]).toMatchObject({ nombre: 'Taco de pastor', precio: 25_00n, cantidad: 3 });
  });

  it('has no cash on a card sale', () => {
    const c = comprobanteDe(leido({ ticket: ticket({ metodo: 'Tarjeta' }) }));
    expect(c.recibido).toBeNull();
    expect(c.cambio).toBeNull();
  });
});

describe('the cancel wording', () => {
  it('adds the note for the owner after the motive', () => {
    expect(motivoCompleto('Otra razón', '  ya no esperó ')).toBe('Otra razón: ya no esperó');
    expect(motivoCompleto('Cobré de más', '   ')).toBe('Cobré de más');
  });

  it('caps what is stored at 500 characters', () => {
    expect(motivoCompleto('Otra razón', 'x'.repeat(600))).toHaveLength(500);
  });

  it('says what to hand back on a cash sale', () => {
    expect(avisoCancelada('V-0412', 'Cobré de más', 135_00n)).toBe(
      'V-0412 cancelada · Cobré de más. Devuelve $135.00.',
    );
    expect(avisoCancelada('V-0412', 'Cobré de más', null)).toBe('V-0412 cancelada · Cobré de más.');
  });
});

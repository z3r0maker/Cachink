/** Rows of one turno, as the phone's repositories return them (tests only). */
import type { CajaTurno, ClientPayment, Expense, Sale, Ticket } from '@xangarro/domain';

export const HOY = '2026-05-14';
const AUDIT = {
  businessId: 'B',
  deviceId: 'D',
  createdByUserId: null,
  updatedAt: '',
  deletedAt: null,
};

export function turno(p: Partial<CajaTurno> = {}): CajaTurno {
  return {
    id: 'T1',
    userId: 'U1',
    fecha: HOY,
    aperturaAt: new Date(2026, 4, 14, 8, 15).toISOString(),
    cierreAt: null,
    montoAperturaCentavos: 800_00n,
    efectivoAdicionalCentavos: 0n,
    montoCierreCentavos: null,
    efectivoEsperadoCentavos: null,
    diferenciaCentavos: null,
    discrepancyReason: null,
    explicacion: null,
    totalTransferencias: 0n,
    totalTarjeta: 0n,
    totalQr: 0n,
    totalCredito: 0n,
    egresoAutoId: null,
    conteoCentavos: null,
    conteoAt: null,
    denominaciones: null,
    createdAt: '',
    ...AUDIT,
    ...p,
  } as CajaTurno;
}

export function ticket(id: string, metodo: Ticket['metodo'], p: Partial<Ticket> = {}): Ticket {
  return {
    id,
    folio: 1,
    fecha: HOY,
    hora: null,
    concepto: 'Venta',
    metodo,
    clienteId: metodo === 'Crédito' ? 'C1' : null,
    estadoPago: 'pagado',
    efectivoRecibidoCentavos: null,
    cambioCentavos: null,
    cajaTurnoId: 'T1',
    cancelMotivo: null,
    cancelledByUserId: null,
    cancelledAt: null,
    createdAt: new Date(2026, 4, 14, 14, 54).toISOString(),
    ...AUDIT,
    ...p,
  } as Ticket;
}

export const linea = (ticketId: string, monto: bigint): Sale =>
  ({
    id: `L${ticketId}`,
    ticketId,
    fecha: HOY,
    concepto: 'Taco',
    categoria: 'Producto',
    monto,
    productoId: 'P1',
    cantidad: 1,
    createdAt: '',
    ...AUDIT,
  }) as Sale;

export const abono = (
  id: string,
  metodo: ClientPayment['metodo'],
  montoCentavos: bigint,
): ClientPayment =>
  ({
    id,
    clienteId: 'C1',
    fecha: HOY,
    montoCentavos,
    metodo,
    nota: null,
    createdAt: new Date(2026, 4, 14, 11, 0).toISOString(),
    ...AUDIT,
  }) as ClientPayment;

export const gasto = (id: string, monto: bigint, cajaTurnoId: string | null = 'T1'): Expense =>
  ({
    id,
    fecha: HOY,
    concepto: 'Gas',
    categoria: 'Servicios',
    monto,
    proveedor: null,
    cajaTurnoId,
    createdAt: new Date(2026, 4, 14, 10, 0).toISOString(),
    ...AUDIT,
  }) as unknown as Expense;

/** $800 fondo + $1,980 cash sales + $550 cash abonos − $620 gastos = $2,710. */
export const FILAS = {
  tickets: [
    ticket('A', 'Efectivo'),
    ticket('B', 'Crédito'),
    ticket('C', 'Tarjeta', { cancelledAt: new Date(2026, 4, 14, 12, 58).toISOString() }),
  ],
  lineas: [linea('A', 1_980_00n), linea('B', 182_00n), linea('C', 50_00n)],
  abonos: [
    abono('A1', 'Efectivo', 400_00n),
    abono('A2', 'Efectivo', 150_00n),
    abono('A3', 'Transferencia', 100_00n),
  ],
  // The unscoped one is an inventory purchase's egreso: not the turno's cash (O-03).
  gastos: [gasto('G1', 450_00n), gasto('G2', 170_00n), gasto('G3', 999_00n, null)],
};

import { newUlid } from '@xangarro/domain';

/**
 * A phone's identity and the wire rows it pushes: tickets, their lines and
 * clients, each returned as the delta exactly as the outbox sends it. The
 * HTTP half (`/activate`, push, pull) stays with whoever owns the transport:
 * the portal's e2e drives it through Playwright's request context.
 */

/** The seeded tenant, Taquería Don Pedro: reference data, read but never rewritten. */
export const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
/** The seed's device. */
export const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV';
/** The seed's taco, the product a sale line points at by default. */
export const TACO = '01HZ8XQN9GZJXV8AKQ5X0PTAC1';
export const CNF = '01HZ8XQN9GZJXV8AKQ5X0CNF01';
export const CNF_PRODUCT = '01HZ8XQN9GZJXV8AKQ5X0CNFP1';

export interface Phone {
  readonly token: string;
  readonly deviceId: string;
  readonly cursor: number;
  /** The business the code joined: Taquería's, or a minted tenant's. */
  readonly businessId: string;
}

/** The part of a phone a wire row is attributed to. */
export type PhoneIdentity = Pick<Phone, 'businessId' | 'deviceId'>;

const AT = '2026-09-17T18:30:00.000Z';
const audit = (phone: PhoneIdentity) => ({
  businessId: phone.businessId,
  deviceId: phone.deviceId,
  createdByUserId: null,
  createdAt: AT,
  updatedAt: AT,
  deletedAt: null,
});

/** Folios are unique per device (ADR-073); one counter per process keeps them apart. */
let folio = 0;

/** A ticket header (ADR-073): method, cash received and change live here now. */
export function ticket(phone: PhoneIdentity, over: Record<string, unknown> = {}) {
  folio += 1;
  const row = {
    id: newUlid(),
    folio,
    fecha: '2026-09-17',
    hora: '12:30',
    concepto: 'Venta E2E',
    metodo: 'Efectivo',
    clienteId: null,
    estadoPago: 'pagado',
    efectivoRecibidoCentavos: 5000n,
    cambioCentavos: 500n,
    cajaTurnoId: null,
    cancelMotivo: null,
    cancelledByUserId: null,
    cancelledAt: null,
    ...audit(phone),
    ...over,
  };
  return { table: 'tickets', rowId: row.id, op: 'insert', clientSeq: 1, row };
}

/** A sale line (ADR-073): it belongs to a ticket pushed in the same batch. */
export function sale(phone: PhoneIdentity, ticketId: string, over: Record<string, unknown> = {}) {
  const id = newUlid();
  const row = {
    id,
    ticketId,
    fecha: '2026-09-17',
    concepto: `Venta E2E ${id.slice(-4)}`,
    categoria: 'Producto',
    monto: 4500n,
    productoId: TACO,
    cantidad: 3,
    ...audit(phone),
    ...over,
  };
  return { table: 'sales', rowId: row.id, op: 'insert', clientSeq: 1, row };
}

export function client(phone: PhoneIdentity, nombre: string) {
  const row = { id: newUlid(), nombre, telefono: null, email: null, nota: null, ...audit(phone) };
  return { table: 'clients', rowId: row.id, op: 'insert', clientSeq: 1, row };
}

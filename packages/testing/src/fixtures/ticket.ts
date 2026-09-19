/**
 * Ticket fixtures — the sale header of ADR-073. Pair with `makeNewSale`
 * lines via their `ticketId`.
 */

import type {
  BusinessId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  NewTicket,
  Ticket,
  TicketId,
} from '@xangarro/domain';
import { newEntityId } from '@xangarro/domain';

const DEFAULT_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEFAULT_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const DEFAULT_TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;

export function makeNewTicket(overrides: Partial<NewTicket> = {}): NewTicket {
  return {
    folio: 405,
    fecha: '2026-04-23' as IsoDate,
    hora: '13:45',
    concepto: 'Venta mostrador',
    metodo: 'Efectivo',
    clienteId: null,
    estadoPago: 'pagado',
    businessId: DEFAULT_BIZ,
    ...overrides,
  } as NewTicket;
}

export function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  const id = (overrides.id ?? newEntityId<TicketId>()) as TicketId;
  return {
    id,
    folio: 405,
    fecha: '2026-04-23' as IsoDate,
    hora: '13:45',
    concepto: 'Venta mostrador',
    metodo: 'Efectivo',
    clienteId: null,
    estadoPago: 'pagado',
    efectivoRecibidoCentavos: null,
    cambioCentavos: null,
    cajaTurnoId: null,
    cancelMotivo: null,
    cancelledByUserId: null,
    cancelledAt: null,
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdByUserId: null,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as Ticket;
}

/**
 * Ticket — the header of a sale (ADR-073). Folio, method, client, cash
 * tendered/change, the turno and the cancellation live here; `sales` are its
 * lines (product, quantity, amount). Registered and cancelled atomically.
 *
 * The folio is a per-device counter assigned at capture, so it works offline;
 * unique on (device, folio). The operator sees `V-0405`; the owner sees
 * «Caja 1 · V-0405».
 */

import { z } from 'zod';
import type { BusinessId, CajaTurnoId, ClientId, TicketId, UserId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema, isoTimestampField } from './_audit.js';
import { isoDateField, moneyField } from './_fields.js';
import { PaymentMethodEnum, PaymentStateEnum } from './sale.js';

/** Displayed per device: V-0405 (ADR-073). */
export const FOLIO_REGEX = /^\d{4,6}$/;

export const TicketSchema = z
  .object({
    id: ulidField<TicketId>(),
    /** Per-device counter; displayed `V-` + folio padded to 4. */
    folio: z.number().int().positive(),
    fecha: isoDateField,
    /** "HH:MM" device time at capture. Null for migrated rows. */
    hora: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable()
      .default(null),
    concepto: z.string().min(1).max(200),
    metodo: PaymentMethodEnum,
    clienteId: ulidField<ClientId>().nullable(),
    estadoPago: PaymentStateEnum,
    /** Cash received (centavos). Only when metodo='Efectivo'; change = recibido − total. */
    efectivoRecibidoCentavos: moneyField.nullable().default(null),
    cambioCentavos: moneyField.nullable().default(null),
    cajaTurnoId: ulidField<CajaTurnoId>().nullable().default(null),
    /** Cancellation (ADR-073): who, why, when; all null while the ticket stands. */
    cancelMotivo: z.string().max(500).nullable().default(null),
    cancelledByUserId: ulidField<UserId>().nullable().default(null),
    cancelledAt: isoTimestampField.nullable().default(null),
  })
  .merge(auditSchema)
  .refine((v) => v.metodo !== 'Crédito' || v.clienteId !== null, {
    message: 'Ticket with metodo=Crédito requires clienteId',
    path: ['clienteId'],
  });

export type Ticket = z.infer<typeof TicketSchema>;

export const NewTicketSchema = z.object({
  folio: z.number().int().positive(),
  fecha: isoDateField,
  hora: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  concepto: z.string().min(1).max(200),
  metodo: PaymentMethodEnum,
  clienteId: ulidField<ClientId>().nullish(),
  estadoPago: PaymentStateEnum,
  efectivoRecibidoCentavos: moneyField.nullish(),
  cambioCentavos: moneyField.nullish(),
  cajaTurnoId: ulidField<CajaTurnoId>().nullish(),
  businessId: ulidField<BusinessId>(),
});

export type NewTicket = z.infer<typeof NewTicketSchema>;

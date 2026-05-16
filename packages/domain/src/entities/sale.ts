/**
 * Sale (Venta) — core transactional entity from CLAUDE.md §9.
 *
 * Fields follow the Spanish naming convention used in the CLAUDE.md domain
 * model. `estadoPago` defaults to `'pagado'` for cash/card/transfer sales and
 * `'pendiente'` for `Crédito` — the invariant is enforced by a cross-field
 * refine below (Crédito always requires a `clienteId`).
 *
 * `productoId` is **required** — every sale references a catalogue producto
 * (ADR-048: product-only sales). `cantidad` supports multi-unit sales.
 */

import { z } from 'zod';
import type { BusinessId, CajaTurnoId, ClientId, ProductId, SaleId, UserId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema, isoTimestampField } from './_audit.js';
import { isoDateField, moneyField } from './_fields.js';

export const PaymentMethodEnum = z.enum([
  'Efectivo',
  'Transferencia',
  'Tarjeta',
  'QR/CoDi',
  'Crédito',
]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const SaleCategoryEnum = z.enum(['Producto', 'Servicio', 'Anticipo', 'Suscripción', 'Otro']);
export type SaleCategory = z.infer<typeof SaleCategoryEnum>;

export const PaymentStateEnum = z.enum(['pagado', 'pendiente', 'parcial']);
export type PaymentState = z.infer<typeof PaymentStateEnum>;

export const SaleSchema = z
  .object({
    id: ulidField<SaleId>(),
    fecha: isoDateField,
    /** "HH:MM" device time at sale creation. Null for legacy records. */
    hora: z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null),
    concepto: z.string().min(1).max(200),
    categoria: SaleCategoryEnum,
    monto: moneyField,
    metodo: PaymentMethodEnum,
    clienteId: ulidField<ClientId>().nullable(),
    estadoPago: PaymentStateEnum,
    productoId: ulidField<ProductId>(),
    cantidad: z.number().int().positive().default(1),
    /** Cash received from the customer (centavos). Only set when metodo='Efectivo'. Change = efectivoRecibidoCentavos − monto. */
    efectivoRecibidoCentavos: moneyField.nullable().default(null),
    /** UserId who cancelled this sale. Null if not cancelled. */
    cancelledByUserId: ulidField<UserId>().nullable().default(null),
    /** Reason for cancellation. Null if not cancelled. */
    cancelMotivo: z.string().max(500).nullable().default(null),
    /** Timestamp when this sale was cancelled. Null if not cancelled. */
    cancelledAt: isoTimestampField.nullable().default(null),
    /** CajaTurno ID that was active when this sale was recorded. Null only for legacy pre-migration sales. */
    cajaTurnoId: ulidField<CajaTurnoId>().nullable().default(null),
  })
  .merge(auditSchema)
  .refine((v) => v.metodo !== 'Crédito' || v.clienteId !== null, {
    message: 'Sale with metodo=Crédito requires clienteId',
    path: ['clienteId'],
  });

export type Sale = z.infer<typeof SaleSchema>;

export const NewSaleSchema = z.object({
  fecha: isoDateField,
  /** Auto-captured device time "HH:MM". Optional — use case fills it. */
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  concepto: z.string().min(1).max(200),
  categoria: SaleCategoryEnum,
  monto: moneyField,
  metodo: PaymentMethodEnum,
  clienteId: ulidField<ClientId>().optional(),
  productoId: ulidField<ProductId>(),
  cantidad: z.number().int().positive().default(1),
  /** Cash received from customer (centavos). Only relevant for Efectivo. */
  efectivoRecibidoCentavos: moneyField.optional(),
  businessId: ulidField<BusinessId>(),
  /** Active CajaTurno ID. Always set by use-case. */
  cajaTurnoId: ulidField<CajaTurnoId>().optional(),
});

export type NewSale = z.infer<typeof NewSaleSchema>;

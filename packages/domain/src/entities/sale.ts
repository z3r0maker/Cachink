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
import type { BusinessId, ProductId, SaleId, TicketId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';
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
    /** The ticket this line belongs to (ADR-073). */
    ticketId: ulidField<TicketId>(),
    /** Business date, copied from the ticket at capture — immutable. */
    fecha: isoDateField,
    concepto: z.string().min(1).max(200),
    categoria: SaleCategoryEnum,
    monto: moneyField,
    productoId: ulidField<ProductId>(),
    cantidad: z.number().int().positive().default(1),
  })
  .merge(auditSchema);

export type Sale = z.infer<typeof SaleSchema>;

export const NewSaleSchema = z.object({
  ticketId: ulidField<TicketId>(),
  fecha: isoDateField,
  concepto: z.string().min(1).max(200),
  categoria: SaleCategoryEnum,
  monto: moneyField,
  productoId: ulidField<ProductId>(),
  cantidad: z.number().int().positive().default(1),
  businessId: ulidField<BusinessId>(),
});

export type NewSale = z.infer<typeof NewSaleSchema>;

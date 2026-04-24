/**
 * Sale (Venta) — core transactional entity from CLAUDE.md §9.
 *
 * Fields follow the Spanish naming convention used in the CLAUDE.md domain
 * model. `estadoPago` defaults to `'pagado'` for cash/card/transfer sales and
 * `'pendiente'` for `Crédito` — the invariant is enforced by a cross-field
 * refine below (Crédito always requires a `clienteId`).
 */

import { z } from 'zod';
import type { BusinessId, ClientId, SaleId } from '../ids/index.js';
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
    fecha: isoDateField,
    concepto: z.string().min(1).max(200),
    categoria: SaleCategoryEnum,
    monto: moneyField,
    metodo: PaymentMethodEnum,
    clienteId: ulidField<ClientId>().nullable(),
    estadoPago: PaymentStateEnum,
  })
  .merge(auditSchema)
  .refine((v) => v.metodo !== 'Crédito' || v.clienteId !== null, {
    message: 'Sale with metodo=Crédito requires clienteId',
    path: ['clienteId'],
  });

export type Sale = z.infer<typeof SaleSchema>;

export const NewSaleSchema = z.object({
  fecha: isoDateField,
  concepto: z.string().min(1).max(200),
  categoria: SaleCategoryEnum,
  monto: moneyField,
  metodo: PaymentMethodEnum,
  clienteId: ulidField<ClientId>().optional(),
  businessId: ulidField<BusinessId>(),
});

export type NewSale = z.infer<typeof NewSaleSchema>;

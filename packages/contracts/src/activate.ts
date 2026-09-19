/**
 * `POST /activate` (docs/plan/02-contracts.md §3).
 */

import { z } from 'zod';
import {
  BusinessSchema,
  ClientSchema,
  ConversionRecetaSchema,
  EmployeeSchema,
  InventoryMovementSchema,
  ProductSchema,
  RecurringExpenseSchema,
  UserSchema,
} from '@xangarro/domain';
import { SignedEntitlementSchema } from './entitlement.js';
import { wireSchema } from './wire.js';

/** 8 chars from an alphabet without 0/O/1/I (§3, B-11). */
export const ACTIVATION_CODE_REGEX = /^[A-HJ-NP-Z2-9]{8}$/;
export const ActivationCodeSchema = z
  .string()
  .transform((s) => s.trim().toUpperCase())
  .pipe(z.string().regex(ACTIVATION_CODE_REGEX, 'activation code'));

/** `web` = the browser register, a device like a phone (ADR-071; C-16). */
export const DevicePlatformSchema = z.enum(['ios', 'android', 'web']);

export const ActivateRequestSchema = z.object({
  email: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.email()),
  code: ActivationCodeSchema,
  device: z.object({
    name: z.string().min(1).max(80),
    platform: DevicePlatformSchema,
    appVersion: z.string().min(1).max(40),
    osVersion: z.string().min(1).max(40),
  }),
});
export type ActivateRequest = z.infer<typeof ActivateRequestSchema>;

/** Operators never carry an email over the wire (§5). */
export const WireUserSchema = wireSchema(UserSchema.omit({ email: true }));

/** Reference tables a device receives (bootstrap and pull share this shape). */
export const ReferenceTablesSchema = z.object({
  businesses: z.array(wireSchema(BusinessSchema)),
  products: z.array(wireSchema(ProductSchema)),
  clients: z.array(wireSchema(ClientSchema)),
  users: z.array(WireUserSchema),
  employees: z.array(wireSchema(EmployeeSchema)),
  recurring_expenses: z.array(wireSchema(RecurringExpenseSchema)),
  conversion_recetas: z.array(wireSchema(ConversionRecetaSchema)).default([]),
  /** Every phone's and the portal's movements: stock is their sum (ADR-081). */
  inventory_movements: z.array(wireSchema(InventoryMovementSchema)).default([]),
  /** Tenant layer only; the device resolves platform × plan itself. */
  feature_flags: z.record(z.string(), z.boolean()),
});
export type ReferenceTables = z.infer<typeof ReferenceTablesSchema>;

export const BootstrapSchema = z.object({
  serverSeq: z.number().int().nonnegative(),
  serverTime: z.string().datetime(),
  tables: ReferenceTablesSchema,
});

export const ActivateResponseSchema = z.object({
  deviceToken: z.string().min(1),
  deviceId: z.string().min(1),
  businessId: z.string().min(1),
  entitlement: SignedEntitlementSchema,
  bootstrap: BootstrapSchema,
});
export type ActivateResponse = z.infer<typeof ActivateResponseSchema>;

export const ACTIVATE_ERROR_CODES = [
  'CODE_INVALID',
  'CODE_EXPIRED',
  'CODE_USED',
  'EMAIL_MISMATCH',
  'NO_DEVICE_SLOTS',
  'BUSINESS_SUSPENDED',
] as const;
export type ActivateErrorCode = (typeof ACTIVATE_ERROR_CODES)[number];

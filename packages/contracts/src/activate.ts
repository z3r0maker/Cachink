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
  MensajeOperadorSchema,
  OpeningBalanceClientSchema,
  OpeningBalanceSchema,
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

const DeviceInfoSchema = z.object({
  name: z.string().min(1).max(80),
  platform: DevicePlatformSchema,
  appVersion: z.string().min(1).max(40),
  osVersion: z.string().min(1).max(40),
});

/**
 * The scannable pairing token (C-14): ≥128 random bits, base64url, single use,
 * 15 minutes. It travels in the link's fragment (`/activar#c=…`), never in a
 * query string, and is never the typed code.
 */
export const PAIRING_TOKEN_REGEX = /^[A-Za-z0-9_-]{22,64}$/;
export const PairingTokenSchema = z.string().regex(PAIRING_TOKEN_REGEX, 'pairing token');

/** Typed path: the owner's email and the 8-character code (§3, unchanged). */
/**
 * The aviso de privacidad version the device showed before linking (N-34).
 * Optional and additive: an older app omits it and still links; the server
 * keeps the version it knows, with its hash, on the device row.
 */
export const AvisoVersionSchema = z.string().trim().min(1).max(40);

export const TypedActivateRequestSchema = z.object({
  email: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.email()),
  code: ActivationCodeSchema,
  device: DeviceInfoSchema,
  avisoVersion: AvisoVersionSchema.optional(),
});

/** Scan path (C-14): the token alone — the 128 bits are the credential, no email. */
export const ScanActivateRequestSchema = z.object({
  qrToken: PairingTokenSchema,
  device: DeviceInfoSchema,
  avisoVersion: AvisoVersionSchema.optional(),
});

/** Either path; additive at protocol version 1 (C-16 precedent). */
export const ActivateRequestSchema = z.union([
  TypedActivateRequestSchema,
  ScanActivateRequestSchema,
]);
export type TypedActivateRequest = z.infer<typeof TypedActivateRequestSchema>;
export type ScanActivateRequest = z.infer<typeof ScanActivateRequestSchema>;
export type ActivateRequest = z.infer<typeof ActivateRequestSchema>;

export function isScanRequest(r: ActivateRequest): r is ScanActivateRequest {
  return 'qrToken' in r;
}

/** Operators: name, PIN hash, avatar, permissions, active — no email, no role (§5, C-11). */
export const WireUserSchema = wireSchema(UserSchema);

/** Reference tables a device receives (bootstrap and pull share this shape). */
export const ReferenceTablesSchema = z.object({
  businesses: z.array(wireSchema(BusinessSchema)),
  products: z.array(wireSchema(ProductSchema)),
  clients: z.array(wireSchema(ClientSchema)),
  users: z.array(WireUserSchema),
  employees: z.array(wireSchema(EmployeeSchema)),
  recurring_expenses: z.array(wireSchema(RecurringExpenseSchema)),
  conversion_recetas: z.array(wireSchema(ConversionRecetaSchema)).default([]),
  /** Owner→operator messages (ADR-075); default [] for old servers. */
  mensajes_operador: z.array(wireSchema(MensajeOperadorSchema)).default([]),
  /** Day-one facts (C-20); default [] — old servers never send them. */
  opening_balances: z.array(wireSchema(OpeningBalanceSchema)).default([]),
  opening_balance_clients: z.array(wireSchema(OpeningBalanceClientSchema)).default([]),
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

/**
 * What `/activate` may answer. `EMAIL_MISMATCH` is gone from it (SEC-DEV-01,
 * owner decision 2026-09-23): a wrong email and an unknown code are one public
 * `CODE_INVALID`, so the answer never confirms a code exists. The server keeps
 * the real reason in its log. The catalog still lists `EMAIL_MISMATCH` so an
 * older server's answer maps to the same message.
 */
export const ACTIVATE_ERROR_CODES = [
  'CODE_INVALID',
  'CODE_EXPIRED',
  'CODE_USED',
  'NO_DEVICE_SLOTS',
  'BUSINESS_SUSPENDED',
] as const;
export type ActivateErrorCode = (typeof ACTIVATE_ERROR_CODES)[number];

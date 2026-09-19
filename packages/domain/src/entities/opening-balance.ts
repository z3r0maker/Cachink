/**
 * Opening balances (C-20, OQ-1 closed 2026-09-17): what the business had on
 * day one so the Balance (NIF B-6) is right from the first statement —
 * caja + bancos on the header, one saldo inicial per cliente on the lines.
 * Written only by the portal (DOWN to devices); rows become read-only once
 * `lockedAt` is set (N-17's explicit owner lock — v1's stand-in for the
 * first period close). Inventory valuation is derived (apertura movements ×
 * costo), never stored.
 */

import { z } from 'zod';
import type { BusinessId, ClientId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';

export const APERTURA_STATUS = ['abierta', 'bloqueada'] as const;

export const OpeningBalanceSchema = z
  .object({
    id: ulidField(),
    businessId: ulidField<BusinessId>(),
    /** Day one; statements treat it as before every period. */
    fechaApertura: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    cajaCentavos: z.bigint().min(0n),
    bancosCentavos: z.bigint().min(0n),
    /** Null until the owner locks; set = read-only (N-17). */
    lockedAt: z.string().nullable(),
  })
  .merge(auditSchema);

export type OpeningBalance = z.infer<typeof OpeningBalanceSchema>;

export const OpeningBalanceClientSchema = z
  .object({
    id: ulidField(),
    businessId: ulidField<BusinessId>(),
    clienteId: ulidField<ClientId>(),
    /** The cliente's day-one saldo; may be negative (saldo a favor). */
    saldoCentavos: z.bigint(),
  })
  .merge(auditSchema);

export type OpeningBalanceClient = z.infer<typeof OpeningBalanceClientSchema>;

export const openingBalanceLocked = (ob: OpeningBalance): boolean => ob.lockedAt !== null;

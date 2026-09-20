/**
 * An item in the admin console's inbox (N-08, ADR-063) — a **portal-only**
 * entity under ADR-060: Postgres only, absent from `scope.ts`, never synced.
 *
 * Every source that needs a human — the app's «Reportar problema», the
 * portal's «Ayuda» form, «Solicitar factura», «Hazlo por mí», limit alerts,
 * the explorer — files one of these. `(source, sourceRef)` is the source's own
 * idempotency key, so a retried delivery never files a second item.
 *
 * `kind = 'factura'` is a subscription payment still owed its CFDI ("pagos sin
 * CFDI", ADR-070): it carries the payment reference, and it can only be
 * resolved once staff record the folio fiscal (UUID) of the CFDI they issued.
 *
 * The branded id is declared here rather than in `ids/index.ts` because
 * nothing outside the admin console mints or passes it (as with `staff.ts`).
 */

import { z } from 'zod';

import type { BusinessId, Ulid } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import type { StaffMemberId } from './staff.js';

export type SupportItemId = Ulid & { readonly __entity: 'SupportItem' };
export const SupportItemIdSchema = ulidField<SupportItemId>();

export const SUPPORT_KINDS = [
  'ayuda',
  'bug',
  'factura',
  'migracion',
  'escalacion',
  'limite',
  'explorador',
  'sistema',
] as const;
export const SupportKindSchema = z.enum(SUPPORT_KINDS);
export type SupportKind = z.infer<typeof SupportKindSchema>;

export const SUPPORT_STATUSES = ['nuevo', 'en_curso', 'resuelto'] as const;
export const SupportStatusSchema = z.enum(SUPPORT_STATUSES);
export type SupportStatus = z.infer<typeof SupportStatusSchema>;

/** Folio fiscal of a CFDI 4.0: an 8-4-4-4-12 hex UUID, stored upper case as SAT prints it. */
export const CFDI_UUID_REGEX = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/;
export const CfdiUuidSchema = z.string().trim().toUpperCase().regex(CFDI_UUID_REGEX);

/** A path inside a private storage bucket — never a URL, never absolute, never `..`. */
export const SupportAttachmentPathSchema = z
  .string()
  .min(1)
  .max(512)
  .regex(/^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/)
  .refine((p) => !p.split('/').includes('..'));

/** Who filed it, e.g. `bug-report`, `portal-ayuda`, `stripe-webhook`. */
export const SupportSourceSchema = z.string().regex(/^[a-z][a-z0-9-]{1,39}$/);

const isoInstant = z.iso.datetime({ offset: true });

const SupportItemShape = z.object({
  id: SupportItemIdSchema,
  kind: SupportKindSchema,
  status: SupportStatusSchema,
  urgent: z.boolean(),
  ownerStaffId: ulidField<StaffMemberId>().nullable(),
  businessId: ulidField<BusinessId>().nullable(),
  title: z.string().trim().min(1).max(200),
  body: z.string().max(10_000),
  attachments: z.array(SupportAttachmentPathSchema).max(20),
  source: SupportSourceSchema,
  sourceRef: z.string().trim().min(1).max(200),
  /** `factura` only: the Stripe invoice / payment the CFDI is owed for. */
  paymentRef: z.string().trim().min(1).max(200).nullable(),
  /** `factura` only: the folio fiscal, set when staff resolve the item. */
  cfdiUuid: CfdiUuidSchema.nullable(),
  createdAt: isoInstant,
  updatedAt: isoInstant,
  resolvedAt: isoInstant.nullable(),
});

type Shape = z.infer<typeof SupportItemShape>;

function checkFactura(item: Shape, ctx: z.RefinementCtx): void {
  const issue = (path: string, message: string) =>
    ctx.addIssue({ code: 'custom', path: [path], message });
  if (item.kind !== 'factura') {
    if (item.paymentRef !== null) issue('paymentRef', 'Solo un item de factura lleva pago.');
    if (item.cfdiUuid !== null) issue('cfdiUuid', 'Solo un item de factura lleva CFDI.');
    return;
  }
  if (item.paymentRef === null) issue('paymentRef', 'Un item de factura necesita su pago.');
  if (item.status === 'resuelto' && item.cfdiUuid === null) {
    issue('cfdiUuid', 'Para resolverlo hace falta el UUID del CFDI.');
  }
}

export const SupportItemSchema = SupportItemShape.superRefine(checkFactura);
export type SupportItem = z.infer<typeof SupportItemSchema>;

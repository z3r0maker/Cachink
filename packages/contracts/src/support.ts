/**
 * `POST /support/bug-report` (docs/plan/02-contracts.md §9, C-25, N-81) — the
 * phone's «Reportar un problema», filed into the staff inbox.
 *
 * The body says what went wrong and from what build: one of four things the
 * person tapped, a sentence if they wrote one, or both (C-26, ADR-162 §5). A
 * report with neither is refused. It has **no field for
 * who is calling**: the device and its business come from the device token,
 * so a caller cannot report as another device or into another business. Ids a
 * client sends anyway are dropped by the schema, never read.
 *
 * The snapshot is what the phone already scrubbed: its last audit events and
 * errors, no stack traces, no personal data. Its size is bounded here in rows
 * and by `MAX_BUG_REPORT_BYTES` on the wire.
 */

import { z } from 'zod';
import { BUG_REPORT_CATEGORIES, ERROR_EVENT_ID_REGEX } from '@xangarro/domain';

/** The whole request body, in bytes of UTF-8. A larger one is refused unread. */
export const MAX_BUG_REPORT_BYTES = 100 * 1024;
export const MAX_BUG_DESCRIPTION = 5000;
/** What the phone's bug-report sheet attaches: its last events and errors. */
export const MAX_BUG_AUDIT_EVENTS = 50;
export const MAX_BUG_ERRORS = 20;

/** Reports one device may file in a day before `RATE_LIMITED` (the server enforces it). */
export const BUG_REPORTS_PER_DEVICE_PER_DAY = 20;

/**
 * What the sheet «¿Qué pasó?» offers to tap (C-26): `could_not_charge`,
 * `froze_or_closed`, `wrong_number`, `other`. The list and its words on screen
 * are the domain's, one copy for the phone, the portal and the console.
 */
export { BUG_REPORT_CATEGORIES, type BugReportCategory } from '@xangarro/domain';

const short = (max: number) => z.string().min(1).max(max);
const entry = z.record(z.string(), z.unknown());

export const BugReportSnapshotSchema = z.object({
  auditEvents: z.array(entry).max(MAX_BUG_AUDIT_EVENTS),
  errors: z.array(entry).max(MAX_BUG_ERRORS),
});
export type BugReportSnapshot = z.infer<typeof BugReportSnapshotSchema>;

export const BugReportRequestSchema = z
  .object({
    /** What the person tapped. A build made before C-26 sends none. */
    category: z.enum(BUG_REPORT_CATEGORIES).optional(),
    /** What the person wrote, trimmed. Empty when they only tapped. */
    description: z.string().trim().max(MAX_BUG_DESCRIPTION).default(''),
    /** The Sentry event this report is about, when it was opened from a failure. */
    eventId: z.string().regex(ERROR_EVENT_ID_REGEX).optional(),
    /** When the person pressed send, by the phone's clock. */
    submittedAt: z.iso.datetime({ offset: true }),
    appVersion: short(40).optional(),
    platform: short(20).optional(),
    osName: short(40).optional(),
    osVersion: short(40).optional(),
    deviceModel: short(80).optional(),
    snapshot: BugReportSnapshotSchema.optional(),
  })
  .refine((r) => r.category !== undefined || r.description !== '', {
    path: ['description'],
    message: 'a report needs a category or a description',
  });
export type BugReportRequest = z.infer<typeof BugReportRequestSchema>;

/** 200: the report is in the staff inbox. A resend of the same report files nothing new. */
export const BugReportResponseSchema = z.object({ accepted: z.literal(true) });
export type BugReportResponse = z.infer<typeof BugReportResponseSchema>;

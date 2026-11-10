/**
 * `POST /support/bug-report` (docs/plan/02-contracts.md §9, C-25, N-81) — the
 * phone's «Reportar un problema», filed into the staff inbox.
 *
 * The body says what went wrong and from what build. It has **no field for
 * who is calling**: the device and its business come from the device token,
 * so a caller cannot report as another device or into another business. Ids a
 * client sends anyway are dropped by the schema, never read.
 *
 * The snapshot is what the phone already scrubbed: its last audit events and
 * errors, no stack traces, no personal data. Its size is bounded here in rows
 * and by `MAX_BUG_REPORT_BYTES` on the wire.
 */

import { z } from 'zod';

/** The whole request body, in bytes of UTF-8. A larger one is refused unread. */
export const MAX_BUG_REPORT_BYTES = 100 * 1024;
export const MAX_BUG_DESCRIPTION = 5000;
/** What the phone's bug-report sheet attaches: its last events and errors. */
export const MAX_BUG_AUDIT_EVENTS = 50;
export const MAX_BUG_ERRORS = 20;

/** Reports one device may file in a day before `RATE_LIMITED` (the server enforces it). */
export const BUG_REPORTS_PER_DEVICE_PER_DAY = 20;

const short = (max: number) => z.string().min(1).max(max);
const entry = z.record(z.string(), z.unknown());

export const BugReportSnapshotSchema = z.object({
  auditEvents: z.array(entry).max(MAX_BUG_AUDIT_EVENTS),
  errors: z.array(entry).max(MAX_BUG_ERRORS),
});
export type BugReportSnapshot = z.infer<typeof BugReportSnapshotSchema>;

export const BugReportRequestSchema = z.object({
  description: z.string().trim().min(1).max(MAX_BUG_DESCRIPTION),
  /** When the person pressed send, by the phone's clock. */
  submittedAt: z.iso.datetime({ offset: true }),
  appVersion: short(40).optional(),
  platform: short(20).optional(),
  osName: short(40).optional(),
  osVersion: short(40).optional(),
  deviceModel: short(80).optional(),
  snapshot: BugReportSnapshotSchema.optional(),
});
export type BugReportRequest = z.infer<typeof BugReportRequestSchema>;

/** 200: the report is in the staff inbox. A resend of the same report files nothing new. */
export const BugReportResponseSchema = z.object({ accepted: z.literal(true) });
export type BugReportResponse = z.infer<typeof BugReportResponseSchema>;

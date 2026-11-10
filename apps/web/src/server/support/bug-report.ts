import 'server-only';

import type { InboxItemRequest, SupportInbox } from '@xangarro/application/support-inbox';
import {
  BUG_REPORTS_PER_DEVICE_PER_DAY,
  BugReportRequestSchema,
  MAX_BUG_REPORT_BYTES,
  type BugReportRequest,
} from '@xangarro/contracts';
import { SUPPORT_ITEM_BODY_MAX } from '@xangarro/domain';

/**
 * The phone's «Reportar un problema», filed into the staff inbox (N-81,
 * contract §9, ADR-141). It replaces the `bug-report` edge function, which
 * held the service-role key and believed whatever device id a caller sent.
 *
 * - **Who** is the device token's: the device and its business are the
 *   caller's, never the body's.
 * - **Limits fail closed**: a report is counted against its device and its
 *   business before it is filed, and a count that cannot be made is an error,
 *   not a zero.
 * - **What is filed fits**: the description is kept whole and the snapshot is
 *   trimmed to what an inbox item holds. Stack traces are never filed.
 *
 * Filing is idempotent on the console's side by `(source, sourceRef)`, so a
 * phone that resends the same report files nothing new.
 */
export interface BugReportCaller {
  readonly deviceId: string;
  readonly businessId: string;
}

export interface BugReportDeps {
  readonly inbox: SupportInbox;
  /** `throttleKey`: the hashed key a limit is counted under. */
  readonly key: (...parts: readonly string[]) => string;
  /** `throttleTake`: seconds to wait before this key may take again; 0 means go. */
  readonly take: (key: string, max: number, windowSeconds: number) => Promise<number>;
}

export type BugReportOutcome =
  | { readonly kind: 'accepted' }
  | { readonly kind: 'invalid'; readonly reason: string }
  | { readonly kind: 'limited'; readonly retryAfter: number };

/** Every phone of one business together: three phones at their own limit. */
export const BUG_REPORTS_PER_BUSINESS_PER_DAY = 60;
const DAY_SECONDS = 86_400;
const TRIMMED = '… (recortado)';
const STACK_KEYS: ReadonlySet<string> = new Set(['errorStack', 'error_stack']);

function parse(raw: string): BugReportRequest | string {
  if (Buffer.byteLength(raw, 'utf8') > MAX_BUG_REPORT_BYTES) return 'the report is too large';
  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return 'the body is not JSON';
  }
  const parsed = BugReportRequestSchema.safeParse(body);
  return parsed.success ? parsed.data : 'a report needs a description and a date';
}

/** The first refusal the limits give, device first; 0 when the report may go on. */
async function waitFor(caller: BugReportCaller, deps: BugReportDeps): Promise<number> {
  const device = await deps.take(
    deps.key('bug-report', 'device', caller.deviceId),
    BUG_REPORTS_PER_DEVICE_PER_DAY,
    DAY_SECONDS,
  );
  if (device > 0) return device;
  return deps.take(
    deps.key('bug-report', 'business', caller.businessId),
    BUG_REPORTS_PER_BUSINESS_PER_DAY,
    DAY_SECONDS,
  );
}

const withoutStacks = (entry: Readonly<Record<string, unknown>>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(entry).filter(([key]) => !STACK_KEYS.has(key)));

function contextOf(report: BugReportRequest): string {
  if (report.snapshot === undefined) return '';
  return JSON.stringify({
    auditEvents: report.snapshot.auditEvents.map(withoutStacks),
    errors: report.snapshot.errors.map(withoutStacks),
  });
}

/** The item's body: what was said, from what, and as much context as fits. */
function bodyOf(report: BugReportRequest, caller: BugReportCaller): string {
  const build = [report.appVersion, report.platform, report.osName, report.osVersion]
    .filter((part) => part !== undefined)
    .join(' · ');
  const head = [
    report.description,
    `Dispositivo: ${caller.deviceId}`,
    report.deviceModel === undefined ? '' : `Modelo: ${report.deviceModel}`,
    build === '' ? '' : `App: ${build}`,
    `Enviado: ${report.submittedAt}`,
  ]
    .filter((line) => line !== '')
    .join('\n');
  const context = contextOf(report);
  if (context === '') return head;
  const label = '\nContexto: ';
  const room = SUPPORT_ITEM_BODY_MAX - head.length - label.length;
  if (context.length <= room) return `${head}${label}${context}`;
  const kept = Math.max(0, room - TRIMMED.length);
  return kept === 0 ? head : `${head}${label}${context.slice(0, kept)}${TRIMMED}`;
}

function itemOf(report: BugReportRequest, caller: BugReportCaller): InboxItemRequest {
  return {
    kind: 'bug',
    urgent: false,
    businessId: caller.businessId,
    title: `Reporte del teléfono ${caller.deviceId.slice(0, 8)}…`,
    body: bodyOf(report, caller),
    source: 'bug-report',
    sourceRef: `${caller.deviceId}:${report.submittedAt}`,
    paymentRef: null,
  };
}

/**
 * Validate, count, file. A limit or an inbox that throws is the caller's to
 * report: the route answers a retryable error and nothing was filed twice.
 */
export async function fileBugReport(
  caller: BugReportCaller,
  rawBody: string,
  deps: BugReportDeps,
): Promise<BugReportOutcome> {
  const report = parse(rawBody);
  if (typeof report === 'string') return { kind: 'invalid', reason: report };
  const retryAfter = await waitFor(caller, deps);
  if (retryAfter > 0) return { kind: 'limited', retryAfter };
  await deps.inbox.file(itemOf(report, caller));
  return { kind: 'accepted' };
}

import { computeFingerprint, toRow } from './rows.ts';
import {
  validateBugReport,
  validateErrorEvent,
  type BugReportInput,
  type ErrorEventInput,
  type Json,
} from './validate.ts';

/**
 * The two ingest routes (F-10). Storage is behind `IngestStore`, so the rules
 * — batch size, validation, the daily limits — are tested without Supabase;
 * `index.ts` supplies the real client.
 *
 * **Every limit fails closed** (security audit 2026-11, F-10). The caller is
 * anyone holding the public anon key and picks its own `deviceId`, so:
 *
 * - a count that could not be made is not zero: the request is refused (503)
 *   and comes back later;
 * - beside the per-device limit there is a ceiling for **all** devices in a
 *   day, so rotating `deviceId` cannot flood the tables or the staff inbox;
 * - a bug report is counted (its row stored) **before** it is filed, and is
 *   not filed if that fails — a payload the table refuses would otherwise
 *   reach the inbox uncounted, without end.
 */
export interface IngestStore {
  /**
   * Rows sent to `table` since `sinceIso` — by `deviceId`, or by every device
   * when it is null. **`null` when the count could not be made**; the store
   * logs why. Never a guess.
   */
  countSince(table: string, deviceId: string | null, sinceIso: string): Promise<number | null>;
  /** `false` when the insert failed; the store logs why. */
  insert(table: string, rows: readonly Json[]): Promise<boolean>;
  /**
   * N-08's wiring: the report also lands in the staff inbox
   * (`kind = 'bug'`) through the console's ingestion endpoint. `false` when
   * the endpoint refused it; the store logs why.
   */
  fileInboxItem(item: {
    readonly title: string;
    readonly body: string;
    readonly sourceRef: string;
    readonly deviceId: string;
    readonly appVersion?: string;
  }): Promise<boolean>;
}

export const MAX_BATCH = 50;
export const MAX_ERRORS_PER_DAY = 200;
export const MAX_REPORTS_PER_DAY = 20;
/**
 * The circuit breakers: one day's total across every device. Sized well above
 * an honest fleet's day — a hundred phones each at its own limit for errors,
 * ten for reports, which is already more than staff can read.
 */
export const MAX_ERRORS_PER_DAY_ALL_DEVICES = 20_000;
export const MAX_REPORTS_PER_DAY_ALL_DEVICES = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

export const json = (body: Json, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

interface Limit {
  readonly table: string;
  readonly deviceId: string;
  /** Rows this request adds. */
  readonly adding: number;
  readonly perDevice: number;
  readonly allDevices: number;
}

/** The refusal this request has earned from the limits, or null when it may go on. */
async function limited(store: IngestStore, limit: Limit, now: number): Promise<Response | null> {
  const since = new Date(now - DAY_MS).toISOString();
  const [mine, everyone] = await Promise.all([
    store.countSince(limit.table, limit.deviceId, since),
    store.countSince(limit.table, null, since),
  ]);
  if (mine === null || everyone === null) {
    return json({ error: 'Rate limit unavailable, try later' }, 503);
  }
  const over = mine + limit.adding > limit.perDevice || everyone + limit.adding > limit.allDevices;
  return over ? json({ error: 'Rate limit exceeded' }, 429) : null;
}

function validEntries(body: unknown): ErrorEventInput[] | Response {
  const raw = (body as { entries?: unknown } | null)?.entries;
  const entries = Array.isArray(raw) ? raw : [];
  if (entries.length === 0) return json({ error: 'No entries provided' }, 400);
  if (entries.length > MAX_BATCH) return json({ error: `Max ${MAX_BATCH} entries per batch` }, 400);
  const valid = entries.map(validateErrorEvent).filter((e): e is ErrorEventInput => e !== null);
  return valid.length > 0 ? valid : json({ error: 'No valid entries' }, 400);
}

export async function handleErrors(
  body: unknown,
  store: IngestStore,
  now: number,
): Promise<Response> {
  const valid = validEntries(body);
  if (valid instanceof Response) return valid;
  // The batch is counted against its first entry's device, as it always was.
  const refusal = await limited(
    store,
    {
      table: 'error_events',
      deviceId: (valid[0] as ErrorEventInput).deviceId,
      adding: valid.length,
      perDevice: MAX_ERRORS_PER_DAY,
      allDevices: MAX_ERRORS_PER_DAY_ALL_DEVICES,
    },
    now,
  );
  if (refusal !== null) return refusal;

  const rows = await Promise.all(
    valid.map(async (e) =>
      toRow({
        ...e,
        fingerprint:
          e.fingerprint || (await computeFingerprint(e.errorName, e.operation, e.errorMessage)),
      }),
    ),
  );
  if (!(await store.insert('error_events', rows))) return json({ error: 'Insert failed' }, 500);
  return json({ accepted: rows.length }, 201);
}

export async function handleBugReport(
  body: unknown,
  store: IngestStore,
  now: number,
): Promise<Response> {
  const report = validateBugReport(body);
  if (report === null) return json({ error: 'Invalid bug report payload' }, 400);
  const refusal = await limited(
    store,
    {
      table: 'bug_reports',
      deviceId: report.deviceId,
      adding: 1,
      perDevice: MAX_REPORTS_PER_DAY,
      allDevices: MAX_REPORTS_PER_DAY_ALL_DEVICES,
    },
    now,
  );
  if (refusal !== null) return refusal;

  // Counted first: the row is what both limits count, so a report that cannot
  // be recorded is not filed — the limit would never see it.
  if (!(await store.insert('bug_reports', [toRow(report)]))) {
    return json({ error: 'Rate limit unavailable, try later' }, 503);
  }
  // Staff visibility (N-08): the inbox item is the product surface; the row
  // above is the counter and the untouched archive. A filing that fails
  // leaves its row: an attempt counts.
  const filed = await store.fileInboxItem(inboxItem(report));
  if (!filed) return json({ error: 'Inbox filing failed' }, 502);
  return json({ accepted: 1 }, 201);
}

function inboxItem(report: BugReportInput): Parameters<IngestStore['fileInboxItem']>[0] {
  return {
    title: `Reporte del teléfono ${report.deviceId.slice(0, 8)}…`,
    body: [
      report.description,
      report.appVersion ? `Versión de la app: ${report.appVersion}` : '',
      report.snapshot === undefined ? '' : `Contexto: ${JSON.stringify(report.snapshot)}`,
      report.submittedAt,
    ]
      .filter((line) => line !== '')
      .join('\n'),
    sourceRef: `bug-report:${report.deviceId}:${report.submittedAt}`,
    deviceId: report.deviceId,
    appVersion: report.appVersion,
  };
}

import { computeFingerprint, toRow } from './rows.ts';
import {
  validateBugReport,
  validateErrorEvent,
  type ErrorEventInput,
  type Json,
} from './validate.ts';

/**
 * The two ingest routes (F-10). Storage is behind `IngestStore`, so the rules
 * — batch size, validation, the per-device daily limits — are tested without
 * Supabase; `index.ts` supplies the real client.
 */
export interface IngestStore {
  /** Rows this device sent to `table` since `sinceIso`. */
  countSince(table: string, deviceId: string, sinceIso: string): Promise<number>;
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
const DAY_MS = 24 * 60 * 60 * 1000;

export const json = (body: Json, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

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
  const deviceId = (valid[0] as ErrorEventInput).deviceId;
  const sent = await store.countSince(
    'error_events',
    deviceId,
    new Date(now - DAY_MS).toISOString(),
  );
  if (sent + valid.length > MAX_ERRORS_PER_DAY) return json({ error: 'Rate limit exceeded' }, 429);

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
  const sent = await store.countSince(
    'bug_reports',
    report.deviceId,
    new Date(now - DAY_MS).toISOString(),
  );
  if (sent >= MAX_REPORTS_PER_DAY) return json({ error: 'Rate limit exceeded' }, 429);

  // Staff visibility first (N-08): the inbox item is the product surface; the
  // raw row below stays as the rate-limit counter and the untouched archive.
  const filed = await store.fileInboxItem({
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
  });
  if (!filed) return json({ error: 'Inbox filing failed' }, 502);
  if (!(await store.insert('bug_reports', [toRow(report)]))) {
    console.error('bug report row insert failed; the inbox item was filed');
  }
  return json({ accepted: 1 }, 201);
}

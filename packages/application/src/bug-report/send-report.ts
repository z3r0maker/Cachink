/**
 * Sending «Reportar un problema» from the phone (M-23, ADR-162 §5).
 *
 * A report the person sends always tries to leave. Without a connection it
 * waits on the device, in a small capped queue, and leaves by itself when the
 * connection returns or the app comes back to the front. The server is
 * idempotent by `submittedAt` (contract §9), so sending one twice is safe.
 *
 * The queue is one JSON value in the device's key-value config, not a table:
 * at most `MAX_QUEUED_REPORTS` small reports, read whole and written whole.
 * What is read back is parsed, never trusted.
 *
 * Nothing is dropped silently and nothing is retried in a loop: a full queue
 * and the daily limit are outcomes the screen says in plain words, and a
 * drain stops at the first report that cannot leave.
 */
import { BugReportRequestSchema, type BugReportRequest } from '@xangarro/contracts';

export const MAX_QUEUED_REPORTS = 5;
export const REPORT_QUEUE_KEY = 'reportesPorEnviar';

/** What one attempt to send came to. */
export type SendOutcome = 'sent' | 'offline' | 'limited' | 'unlinked' | 'rejected';

/** What the person is told after pressing «Enviar». */
export type ReportResult = 'sent' | 'queued' | 'queue_full' | 'limited' | 'failed';

export interface ReportStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export interface ReportSender {
  send(report: BugReportRequest): Promise<SendOutcome>;
}

export interface ReportDeps {
  readonly store: ReportStore;
  readonly sender: ReportSender;
}

/** The device API's answer, as `ApiClient.bugReport` gives it. */
export type ApiAnswer =
  { readonly ok: true } | { readonly ok: false; readonly status: number; readonly code: string };

const NO_SIGNAL: ReadonlySet<string> = new Set(['NETWORK', 'TIMEOUT', 'BAD_RESPONSE']);

/** What to do next with an answer: it left, try later, say the limit, or give up. */
export function outcomeOf(answer: ApiAnswer): SendOutcome {
  if (answer.ok) return 'sent';
  if (NO_SIGNAL.has(answer.code) || answer.status >= 500) return 'offline';
  if (answer.status === 429) return 'limited';
  if (answer.status === 401) return 'unlinked';
  return 'rejected';
}

function parseQueue(raw: string | null): BugReportRequest[] {
  if (raw === null) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const parsed = BugReportRequestSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

/** The reports waiting on the device, oldest first. */
export async function queuedReports(store: ReportStore): Promise<BugReportRequest[]> {
  return parseQueue(await store.get(REPORT_QUEUE_KEY));
}

const save = (store: ReportStore, queue: readonly BugReportRequest[]): Promise<void> =>
  store.set(REPORT_QUEUE_KEY, JSON.stringify(queue));

async function enqueue(report: BugReportRequest, store: ReportStore): Promise<ReportResult> {
  const queue = await queuedReports(store);
  if (queue.some((r) => r.submittedAt === report.submittedAt)) return 'queued';
  if (queue.length >= MAX_QUEUED_REPORTS) return 'queue_full';
  await save(store, [...queue, report]);
  return 'queued';
}

/** Try to send; without a connection, keep it for later. */
export async function sendReport(
  report: BugReportRequest,
  deps: ReportDeps,
): Promise<ReportResult> {
  const outcome = await deps.sender.send(report);
  if (outcome === 'sent') return 'sent';
  if (outcome === 'offline') return enqueue(report, deps.store);
  return outcome === 'limited' ? 'limited' : 'failed';
}

/**
 * Send what waited, oldest first. It stops at the first report that cannot
 * leave now (no connection, the daily limit, a caja no longer linked) and
 * keeps it and the rest; a report the server refuses outright is dropped,
 * since resending it would never change the answer.
 */
export async function drainReports(deps: ReportDeps): Promise<{ sent: number; left: number }> {
  let queue = await queuedReports(deps.store);
  let sent = 0;
  while (queue.length > 0) {
    const outcome = await deps.sender.send(queue[0] as BugReportRequest);
    if (outcome !== 'sent' && outcome !== 'rejected') break;
    if (outcome === 'sent') sent += 1;
    queue = queue.slice(1);
    await save(deps.store, queue);
  }
  return { sent, left: queue.length };
}

import type { CDPSession, Page } from '@playwright/test';

/**
 * Web Worker coverage (ADR-102, P-35). The register's data layer runs in a
 * Worker, and Playwright's page coverage stops at the page: every access op
 * the operador specs drive through the real door read 0%.
 *
 * A second CDP session on the page auto-attaches to its workers in the
 * non-flat mode — its messages ride `Target.sendMessageToTarget`, so they need
 * no session routing Playwright does not expose — pauses each on start, turns
 * on precise coverage before its first line runs, and lets it go. Sources
 * come from the server, not the Debugger domain, which would pause the worker
 * on any `debugger;` left in a chunk.
 */

type Entry = { url: string; source: string; functions: unknown[] };
type Reply = { id?: number; result?: unknown };
type Taken = { url: string; functions: unknown[] };

const APP_CHUNK = '/_next/static/';
/** A worker that died mid-collection answers nothing; its coverage is gone either way. */
const TAKE_TIMEOUT_MS = 5_000;

function within<T>(ms: number, work: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([work, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

class WorkerLink {
  private seq = 0;
  private readonly pending = new Map<number, (result: unknown) => void>();

  constructor(
    private readonly cdp: CDPSession,
    readonly sessionId: string,
  ) {}

  send<T>(method: string, params: object = {}): Promise<T> {
    const id = ++this.seq;
    const reply = new Promise<T>((resolve) =>
      this.pending.set(id, resolve as (r: unknown) => void),
    );
    const message = JSON.stringify({ id, method, params });
    void this.cdp.send('Target.sendMessageToTarget', { sessionId: this.sessionId, message });
    return reply;
  }

  receive(raw: string): void {
    const m = JSON.parse(raw) as Reply;
    if (m.id === undefined) return;
    this.pending.get(m.id)?.(m.result);
    this.pending.delete(m.id);
  }

  async start(): Promise<void> {
    await this.send('Profiler.enable');
    await this.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
    await this.send('Runtime.runIfWaitingForDebugger');
  }

  /** The app's chunks only; the worker also runs sql.js's glue. */
  async take(): Promise<Taken[]> {
    const { result } = await this.send<{ result: Taken[] }>('Profiler.takePreciseCoverage');
    return result.filter((r) => r.url.includes(APP_CHUNK));
  }
}

export interface WorkerRecorder {
  /** The coverage of the workers alive now; recording goes on (V8 resets their counters). */
  readonly take: () => Promise<Entry[]>;
  readonly stop: () => Promise<void>;
}

/**
 * One session for the page's whole life. Recreating it mid-navigation — at
 * the moment the page's other half collects its coverage — aborted the
 * navigation: a target auto-attached while paused was never resumed.
 * Anything attached that is not a worker is let go at once, for the same reason.
 */
export async function recordWorkerCoverage(page: Page): Promise<WorkerRecorder> {
  const cdp = await page.context().newCDPSession(page);
  const links = new Map<string, WorkerLink>();
  cdp.on('Target.receivedMessageFromTarget', ({ sessionId, message }) => {
    links.get(sessionId)?.receive(message);
  });
  cdp.on('Target.detachedFromTarget', ({ sessionId }) => links.delete(sessionId));
  cdp.on('Target.attachedToTarget', ({ sessionId, targetInfo }) => {
    const link = new WorkerLink(cdp, sessionId);
    if (targetInfo.type !== 'worker') {
      void link.send('Runtime.runIfWaitingForDebugger');
      return;
    }
    links.set(sessionId, link);
    void link.start();
  });
  await cdp.send('Target.setAutoAttach', {
    autoAttach: true,
    waitForDebuggerOnStart: true,
    flatten: false,
  });
  return {
    take: async () => {
      const taken = await Promise.all(
        [...links.values()].map((l) => within(TAKE_TIMEOUT_MS, l.take(), [])),
      );
      // V8 reports offsets into the script as served, so the source is the chunk itself.
      return Promise.all(
        taken
          .flat()
          .map(async (t) => ({ ...t, source: await (await page.request.get(t.url)).text() })),
      );
    },
    stop: () => cdp.detach().catch(() => undefined),
  };
}

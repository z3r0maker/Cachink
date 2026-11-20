import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import type { BrowserContext, Page, Request, Response } from 'playwright-core';

/**
 * `capture.ts` (S-05): the run's evidence, on one clock, `t` milliseconds from
 * the run's start, so the judge can line a console error up with the step that
 * caused it. `console.jsonl` keeps errors and warnings; `network.jsonl` keeps
 * failures, 4xx/5xx and slow requests; each step gets a screenshot and the
 * screen fingerprint Studio's reactions read (ADR-154 §4); the Playwright
 * trace holds the rest.
 */
export const SLOW_REQUEST_MS = 1_500;

const pad = (n: number) => String(n).padStart(3, '0');

export class Capture {
  private readonly t0 = Date.now();

  constructor(
    private readonly dir: string,
    private readonly context: BrowserContext,
    private readonly page: Page,
  ) {
    mkdirSync(join(dir, 'screenshots'), { recursive: true });
  }

  private t(): number {
    return Date.now() - this.t0;
  }

  private line(file: string, record: Record<string, unknown>): void {
    appendFileSync(join(this.dir, file), `${JSON.stringify({ t: this.t(), ...record })}\n`);
  }

  async start(): Promise<void> {
    this.page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning')
        this.line('console.jsonl', { type: m.type(), text: m.text() });
    });
    this.page.on('pageerror', (e) =>
      this.line('console.jsonl', { type: 'pageerror', text: e.message }),
    );
    this.page.on('requestfailed', (r) =>
      this.request(r, undefined, r.failure()?.errorText ?? 'failed'),
    );
    this.page.on('requestfinished', (r) => {
      void r.response().then((res) => this.request(r, res ?? undefined, undefined));
    });
    await this.context.tracing.start({ screenshots: true, snapshots: true });
  }

  private request(r: Request, res: Response | undefined, failure: string | undefined): void {
    const timing = r.timing();
    const ms = Math.round(timing.responseEnd >= 0 ? timing.responseEnd : -1);
    const status = res?.status();
    const slow = ms > SLOW_REQUEST_MS;
    if (failure === undefined && (status ?? 0) < 400 && !slow) return;
    this.line('network.jsonl', {
      method: r.method(),
      url: r.url(),
      status: status ?? null,
      ms,
      ...(failure ? { failure } : {}),
    });
  }

  /** Marks a step on the timeline, with its screenshot and screen fingerprint. */
  async step(
    n: number,
    action: string,
  ): Promise<{ readonly fingerprint: string; readonly screenshot: string }> {
    const screenshot = `screenshots/step-${pad(n)}.png`;
    await this.page.screenshot({ path: join(this.dir, screenshot) }).catch(() => undefined);
    const fingerprint = await screenFingerprint(this.page);
    this.line('steps.jsonl', { n, action, fingerprint, screenshot });
    return { fingerprint, screenshot };
  }

  async stop(): Promise<void> {
    await this.context.tracing.stop({ path: join(this.dir, 'trace.zip') }).catch(() => undefined);
  }
}

/**
 * What the screen is, for «did it change?»: the path and a hash of the visible
 * text and the element count. Two steps on one screen share it; a new dialog,
 * a new total or a new page does not.
 */
export async function screenFingerprint(page: Page): Promise<string> {
  const path = new URL(page.url()).pathname;
  // A string expression: it runs in the page, where `document` exists; this package has no DOM types.
  const dom = await page
    .evaluate<string>(
      "`${document.body ? document.body.innerText : ''}|${document.getElementsByTagName('*').length}`",
    )
    .catch(() => 'unreadable');
  return `url:${path}#dom:${createHash('sha256').update(dom).digest('hex').slice(0, 12)}`;
}

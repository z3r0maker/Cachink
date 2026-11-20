import { createHash } from 'node:crypto';
import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';

import type { Device } from './device';
import { apiProblem, parseLogcat } from './signals';

/**
 * The phone run's evidence on one clock (S-06), like the web's `capture.ts`:
 * `console.jsonl` from logcat, `network.jsonl` from the portal's own API log
 * (this tenant's failed, refused and slow calls), and per step a screenshot
 * and the fingerprint of the hierarchy the proxy saved after the action.
 */
const pad = (n: number) => String(n).padStart(3, '0');

export class PhoneCapture {
  private readonly t0 = Date.now();
  private stopLogcat: () => void = () => undefined;
  private tail: NodeJS.Timeout | undefined;
  private offset = 0;

  constructor(
    private readonly dir: string,
    private readonly device: Device,
    private readonly serverLog: string,
    private readonly biz: string,
  ) {
    mkdirSync(join(dir, 'screenshots'), { recursive: true });
  }

  private line(file: string, record: Record<string, unknown>): void {
    appendFileSync(
      join(this.dir, file),
      `${JSON.stringify({ t: Date.now() - this.t0, ...record })}\n`,
    );
  }

  async start(): Promise<void> {
    this.stopLogcat = await this.device.logcat((raw) => {
      const l = parseLogcat(raw);
      if (l !== undefined) this.line('console.jsonl', { type: l.level, tag: l.tag, text: l.text });
    });
    this.offset = existsSync(this.serverLog) ? statSync(this.serverLog).size : 0;
    this.tail = setInterval(() => this.readServerLog(), 1_000);
  }

  /** The server log's new lines since the last read, stamped as they are read. */
  private readServerLog(): void {
    if (!existsSync(this.serverLog)) return;
    const size = statSync(this.serverLog).size;
    if (size <= this.offset) return;
    const fd = openSync(this.serverLog, 'r');
    const buf = Buffer.alloc(size - this.offset);
    readSync(fd, buf, 0, buf.length, this.offset);
    closeSync(fd);
    this.offset = size;
    for (const l of buf.toString('utf8').split('\n')) {
      const problem = apiProblem(l, this.biz);
      if (problem !== undefined) this.line('network.jsonl', problem);
    }
  }

  async step(n: number, action: string): Promise<{ readonly fingerprint: string }> {
    const screenshot = `screenshots/step-${pad(n)}.png`;
    await this.device.screenshot(join(this.dir, screenshot)).catch(() => undefined);
    const fingerprint = screenFingerprint(join(this.dir, 'hierarchy', `step-${pad(n)}.json`));
    this.line('steps.jsonl', { n, action, fingerprint, screenshot });
    return { fingerprint };
  }

  stop(): void {
    this.readServerLog();
    clearInterval(this.tail);
    this.stopLogcat();
  }
}

/** The screen after a step, as the proxy saved it: same hierarchy, same fingerprint. */
export function screenFingerprint(hierarchyFile: string): string {
  const text = existsSync(hierarchyFile) ? readFileSync(hierarchyFile, 'utf8') : 'missing';
  return `screen:${createHash('sha256').update(text).digest('hex').slice(0, 12)}`;
}

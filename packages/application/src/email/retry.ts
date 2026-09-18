/**
 * Retries with exponential backoff on 429 and 5xx (B-14). Safe because every
 * message carries an idempotency key: a retry of a send the provider did
 * accept is answered with the first email, not a second one.
 */
import { EmailSendError } from './errors.js';
import type { EmailSender, EmailSendResult } from './message.js';

export interface RetryOptions {
  /** Total tries, first one included. Default 3. */
  readonly attempts?: number;
  /** First wait; each next one is 3× longer. Default 500 ms. */
  readonly baseDelayMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
}

/** This package compiles without DOM or Node typings; every runtime it runs on has a timer. */
const timers = globalThis as unknown as { setTimeout(fn: () => void, ms: number): unknown };
const wait = (ms: number) => new Promise<void>((resolve) => void timers.setTimeout(resolve, ms));

async function once(inner: EmailSender, message: Parameters<EmailSender['send']>[0]) {
  try {
    return await inner.send(message);
  } catch (error) {
    const why = error instanceof Error ? error.message : String(error);
    return { ok: false, error: EmailSendError.fromStatus(null, why) } as const;
  }
}

export function retryingSender(inner: EmailSender, options: RetryOptions = {}): EmailSender {
  const attempts = Math.max(1, options.attempts ?? 3);
  const base = options.baseDelayMs ?? 500;
  const sleep = options.sleep ?? wait;
  return {
    async send(message) {
      let result: EmailSendResult = await once(inner, message);
      for (let i = 1; i < attempts && !result.ok && result.error.retryable; i += 1) {
        await sleep(base * 3 ** (i - 1));
        result = await once(inner, message);
      }
      return result;
    },
  };
}

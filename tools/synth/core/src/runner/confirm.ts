import { setTimeout as sleep } from 'node:timers/promises';

/**
 * A signup run's confirmation email (S-10, owner decision): the actor has only
 * a browser, so when the portal's email lands in the corrida's outbox the
 * runner opens its link in the actor's tab, as tapping it on the phone would.
 * The watch opens it once, keeps going through a read that fails (the file may
 * be mid-write), and ends when it has opened the link or is stopped.
 */
export interface ConfirmationWatch {
  /** Settles once the link was opened (or failed to open), or after `stop()`. */
  readonly done: Promise<{ readonly opened: string | null; readonly error?: string }>;
  readonly stop: () => void;
}

export interface WatchInput {
  /** The link, once the email is there; null before. */
  readonly find: () => Promise<string | null>;
  readonly open: (link: string) => Promise<void>;
  readonly everyMs?: number;
}

async function firstLink(find: WatchInput['find'], stopped: () => boolean, everyMs: number) {
  while (!stopped()) {
    const link = await find().catch(() => null);
    if (link !== null) return link;
    await sleep(everyMs);
  }
  return null;
}

export function watchConfirmation(w: WatchInput): ConfirmationWatch {
  let stopped = false;
  const done = (async () => {
    const link = await firstLink(w.find, () => stopped, w.everyMs ?? 1_000);
    if (link === null) return { opened: null };
    try {
      await w.open(link);
      return { opened: link };
    } catch (e) {
      return { opened: null, error: e instanceof Error ? e.message : String(e) };
    }
  })();
  return {
    done,
    stop: () => {
      stopped = true;
    },
  };
}

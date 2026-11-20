import type { Stack } from './stack';

/**
 * Ctrl-C, a terminal closing or a `kill` tears the stack down before the
 * process exits, with the conventional 128 + signal exit code. SIGKILL cannot
 * be caught; the lock file and `reapOrphans` cover it.
 */
const SIGNALS = { SIGINT: 2, SIGTERM: 15, SIGHUP: 1 } as const;

export function tearDownOnSignals(stack: Pick<Stack, 'stop'>): () => void {
  const handlers = Object.entries(SIGNALS).map(([name, n]) => {
    const handler = () => {
      void stack.stop().finally(() => process.exit(128 + n));
    };
    process.once(name, handler);
    return [name, handler] as const;
  });
  return () => {
    for (const [name, handler] of handlers) process.off(name, handler);
  };
}

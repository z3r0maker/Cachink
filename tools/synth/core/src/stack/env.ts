import type { Stack } from './stack';

/**
 * What a process needs to work on a corrida's stack: the three database URLs
 * the fixtures and success checks read (`@xangarro/testing/tenant`), and,
 * for a command run on it (`stack run`), the portal and its mail folder.
 */
export function stackEnv(stack: Stack): Record<string, string> {
  return {
    DATABASE_URL: stack.urls.database,
    DATABASE_SUPER_URL: stack.urls.superUser,
    BILLING_DATABASE_URL: stack.urls.billing,
    ...(stack.baseUrl === undefined ? {} : { SYNTH_BASE_URL: stack.baseUrl }),
    SYNTH_OUTBOX_DIR: stack.names.outboxDir,
  };
}

/** The stack's databases, for the seed and the success checks in this process. */
export function useStackDatabases(stack: Stack): void {
  const env = stackEnv(stack);
  process.env.DATABASE_URL = env.DATABASE_URL;
  process.env.DATABASE_SUPER_URL = env.DATABASE_SUPER_URL;
  process.env.BILLING_DATABASE_URL = env.BILLING_DATABASE_URL;
}

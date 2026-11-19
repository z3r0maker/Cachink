/**
 * The two database URLs the suite needs beyond `DATABASE_URL`, resolved the
 * same way from both sides of the run: `playwright.config.ts` (which hands them
 * to the Next server) and the global setup (which locks the shared tenant on
 * the owner connection).
 *
 * They live in `@xangarro/testing/tenant` since S-02 (ADR-153 §4), so the
 * fixtures and Synth's stack resolve them from the same `db-local.sh`.
 */
export { billingDatabaseUrl, superDatabaseUrl } from '@xangarro/testing/tenant';

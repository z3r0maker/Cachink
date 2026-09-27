/**
 * Re-exported so the data-pg suites keep their import. The guard itself lives in
 * `@xangarro/testing/integration`, shared with the portal's integration suite
 * (`apps/web/tests/*.integration.test.ts`): one fuse, one place (CLAUDE.md §2.3).
 */
export {
  integrationSuite,
  type IntegrationSuite,
  type SuiteFn,
} from '@xangarro/testing/integration';

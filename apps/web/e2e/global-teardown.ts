import { coverageEnabled } from '../scripts/coverage-gate/options';
import { addServerCoverageAndWrite } from './coverage';

/** Runs before Playwright stops the server, so the server can still be asked. */
export default async function globalTeardown(): Promise<void> {
  if (coverageEnabled) await addServerCoverageAndWrite();
}

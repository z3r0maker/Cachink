/**
 * Shared helpers for the repository contract-test factories.
 *
 * Each factory (e.g. `describeSalesRepositoryContract`) takes an
 * implementation name + a factory that returns a fresh repository instance.
 * The factory is invoked inside a `beforeEach` so every test starts from a
 * clean slate — same behaviour for the in-memory and Drizzle impls.
 */

import type { DeviceId } from '@cachink/domain';

/**
 * Fixed device id used across every contract test. Using a constant makes
 * audit-column assertions deterministic: every row written by the impl
 * should carry this value, regardless of which impl is under test.
 */
export const TEST_DEVICE_ID = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;

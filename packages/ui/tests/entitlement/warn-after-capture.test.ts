/**
 * warnAfterCapture — N-04: a capture is never refused; once it is saved, a
 * month at the plan's limit opens the neutral sheet. Sales, egresos and
 * inventory movements all go through it (M-11: a sale, the month's primary
 * record, used to skip it).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { UNLIMITED_QUOTA, type RecordQuota } from '@xangarro/application';
import { usePlanLimitStore, warnAfterCapture } from '../../src/entitlement/plan-limit-store';

const quotaAt = (warning: Awaited<ReturnType<RecordQuota['warning']>>): RecordQuota => ({
  assertCanCreate: async () => undefined,
  warning: async () => warning,
});

afterEach(() => usePlanLimitStore.getState().dismiss());

describe('warnAfterCapture', () => {
  it('opens the sheet when the month has reached the limit', async () => {
    await warnAfterCapture(quotaAt({ plan: 'freelancer' as never, limit: 300, used: 300 }));
    expect(usePlanLimitStore.getState().hit).toEqual({ plan: 'freelancer', limit: 300 });
  });

  it('stays quiet under the limit', async () => {
    await warnAfterCapture(quotaAt(null));
    expect(usePlanLimitStore.getState().hit).toBeNull();
  });

  it('stays quiet on an unlimited plan', async () => {
    await warnAfterCapture(UNLIMITED_QUOTA);
    expect(usePlanLimitStore.getState().hit).toBeNull();
  });

  it('lets a failed usage read reach the mutation instead of swallowing it', async () => {
    const broken: RecordQuota = {
      assertCanCreate: async () => undefined,
      warning: async () => {
        throw new Error('usage read failed');
      },
    };
    await expect(warnAfterCapture(broken)).rejects.toThrow('usage read failed');
    expect(usePlanLimitStore.getState().hit).toBeNull();
  });
});

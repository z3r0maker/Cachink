import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

/**
 * The phone's way to send «Reportar un problema» (N-81, contract §9): through
 * the device API with the device's own token. A phone that is not linked has
 * no sender. One attempt answers what to do next (M-23): it left, there is no
 * connection, the daily limit, a caja no longer linked, or a refusal.
 */
const bugReport = vi.fn();
let token: string | null = 'tok-1';
let record: { businessId: string } | null | undefined = { businessId: 'b-1' };

// One context object, as the real provider memoises it.
const context = {
  client: { bugReport: (...args: unknown[]) => bugReport(...args) },
  config: { tokenStore: { get: async () => token } },
};
vi.mock('../../src/activation/activation-context', () => ({
  useActivationContext: () => context,
}));
vi.mock('../../src/activation/use-activation-state', () => ({
  useActivationState: () => ({ record }),
}));

import { useBugReportSender } from '../../src/observability/bug-report-sender';

const REPORT = { description: 'Se cerró al cobrar', submittedAt: '2026-11-10T02:15:00.000Z' };

beforeEach(() => {
  bugReport.mockReset();
  bugReport.mockResolvedValue({ ok: true, data: { accepted: true } });
  token = 'tok-1';
  record = { businessId: 'b-1' };
});

describe('useBugReportSender', () => {
  it('sends the report through the device API with the device token', async () => {
    const { result } = renderHook(() => useBugReportSender());
    expect(await result.current?.send(REPORT)).toBe('sent');
    expect(bugReport).toHaveBeenCalledWith('tok-1', REPORT);
  });

  it('is absent on a phone that is not linked, or still finding out', () => {
    record = null;
    expect(renderHook(() => useBugReportSender()).result.current).toBeNull();
    record = undefined;
    expect(renderHook(() => useBugReportSender()).result.current).toBeNull();
  });

  it('answers «unlinked» without a token, and calls nobody', async () => {
    token = null;
    const { result } = renderHook(() => useBugReportSender());
    expect(await result.current?.send(REPORT)).toBe('unlinked');
    expect(bugReport).not.toHaveBeenCalled();
  });

  it('reads the server’s answer as what to do next', async () => {
    const { result } = renderHook(() => useBugReportSender());
    const answers = [
      [{ ok: false, status: 0, code: 'NETWORK', message: 'x' }, 'offline'],
      [{ ok: false, status: 429, code: 'RATE_LIMITED', message: 'x' }, 'limited'],
      [{ ok: false, status: 401, code: 'DEVICE_REVOKED', message: 'x' }, 'unlinked'],
      [{ ok: false, status: 400, code: 'VALIDATION', message: 'x' }, 'rejected'],
    ] as const;
    for (const [answer, outcome] of answers) {
      bugReport.mockResolvedValue(answer);
      expect(await result.current?.send(REPORT)).toBe(outcome);
    }
  });

  it('keeps one sender across renders while nothing it depends on changes', () => {
    const { result, rerender } = renderHook(() => useBugReportSender());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

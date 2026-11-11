import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

/**
 * The phone's way to send «Reportar un problema» (N-81, contract §9): through
 * the device API with the device's own token. A phone that is not linked has
 * no sender, so the sheet offers only «compartir»; a refusal or a missing
 * token throws, which is what makes the sheet point at the share fallback.
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
    await result.current?.sendBugReport(REPORT);
    expect(bugReport).toHaveBeenCalledWith('tok-1', REPORT);
  });

  it('is absent on a phone that is not linked, or still finding out', () => {
    record = null;
    expect(renderHook(() => useBugReportSender()).result.current).toBeNull();
    record = undefined;
    expect(renderHook(() => useBugReportSender()).result.current).toBeNull();
  });

  it('throws without a token, so the sheet offers the share fallback', async () => {
    token = null;
    const { result } = renderHook(() => useBugReportSender());
    await expect(result.current?.sendBugReport(REPORT)).rejects.toThrow('NOT_ACTIVATED');
    expect(bugReport).not.toHaveBeenCalled();
  });

  it('throws the server’s refusal by its code', async () => {
    bugReport.mockResolvedValue({ ok: false, status: 429, code: 'RATE_LIMITED', message: 'x' });
    const { result } = renderHook(() => useBugReportSender());
    await expect(result.current?.sendBugReport(REPORT)).rejects.toThrow('RATE_LIMITED');
  });

  it('keeps one sender across renders while nothing it depends on changes', () => {
    const { result, rerender } = renderHook(() => useBugReportSender());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

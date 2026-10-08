import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

/**
 * The bug-report sheet's submit logic (split out of the sheet for the §2.6
 * budget): snapshot, scrub, and the two ways out — remote-first with a
 * message on failure, share-as-file as the fallback and the only route when
 * consent is off. What must never happen: a stack trace or unscrubbed
 * metadata leaving the device through either door.
 */

const exportSnapshot = vi.fn();
vi.mock('../../../src/observability/observability-provider', () => ({
  useLogStore: () => logStoreActual,
}));

import { useBugReportSubmit } from '../../../src/screens/Settings/use-bug-report-submit';

let logStoreActual: unknown = { exportSnapshot };

const snapshot = {
  exportedAt: '2026-09-27T12:00:00.000Z',
  deviceId: 'dev-1',
  auditEvents: [
    {
      id: 'a1',
      timestamp: '2026-09-27T10:00:00.000Z',
      operation: 'sale.create',
      entityType: 'sale',
      entityId: 's-1',
      userId: null,
      deviceId: 'dev-1',
      businessId: 'b-1',
      metadata: { telefono: '55 1234 5678', clienteEmail: 'maria@ejemplo.mx' },
    },
  ],
  errors: [
    {
      id: 'e1',
      timestamp: '2026-09-27T11:00:00.000Z',
      source: 'sync',
      errorName: 'Error',
      errorMessage: 'boom',
      errorStack: 'at confidential internals',
      userId: null,
      context: { telefono: '55 1234 5678' },
    },
  ],
};

const CONTEXTO = {
  model: 'iPhone 16',
  osName: 'iOS',
  osVersion: '18.1',
  appVersion: '1.2.0',
  platform: 'ios' as const,
};

beforeEach(() => {
  vi.useFakeTimers();
  exportSnapshot.mockReset();
  exportSnapshot.mockResolvedValue(snapshot);
  logStoreActual = { exportSnapshot };
});

afterEach(() => {
  vi.useRealTimers();
});

async function montar(opts: { remote?: unknown; contexto?: unknown } = {}) {
  const onShare = vi.fn();
  const onClose = vi.fn();
  const hook = renderHook(() =>
    useBugReportSubmit(
      onShare,
      onClose,
      opts.remote as never,
      (opts.contexto as never) ?? CONTEXTO,
      { beta: true },
    ),
  );
  await act(async () => {
    hook.result.current.setDescription('No guarda el ticket');
  });
  return { hook, onShare, onClose };
}

describe('handleShareSubmit', () => {
  it('hands the share sheet a scrubbed file with the readable timeline, and closes', async () => {
    const { hook, onShare, onClose } = await montar();
    await act(async () => {
      await hook.result.current.handleShareSubmit();
    });
    expect(onShare).toHaveBeenCalledTimes(1);
    const [json, filename, timeline] = onShare.mock.calls[0] as [
      string,
      string,
      string | undefined,
    ];
    expect(filename).toMatch(/^xangarro-bug-report-\d+\.json$/);
    const report = JSON.parse(json) as {
      description: string;
      readableTimeline: string;
      snapshot: typeof snapshot;
      deviceModel: string;
      featureFlags: Record<string, boolean>;
    };
    expect(report.description).toBe('No guarda el ticket');
    expect(report.deviceModel).toBe('iPhone 16');
    expect(report.featureFlags).toEqual({ beta: true });
    // The stack never leaves; the metadata does, scrubbed — by exact key
    // (`telefono` is on the PII list). A key the list does not name passes
    // as-is: that is today's contract, not this test's to change.
    expect(report.snapshot.errors[0]?.errorStack).toBeUndefined();
    expect(report.snapshot.auditEvents[0]?.metadata).toEqual({
      telefono: '[REDACTED]',
      clienteEmail: 'maria@ejemplo.mx',
    });
    expect(timeline).toContain('ERROR [sync] Error: boom');
    expect(hook.result.current.description).toBe('');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('nothing to say, or nowhere to read it from, is a no-op', async () => {
    const { hook, onShare } = await montar();
    await act(async () => {
      hook.result.current.setDescription('   ');
    });
    await act(async () => {
      await hook.result.current.handleShareSubmit();
    });
    expect(onShare).not.toHaveBeenCalled();

    logStoreActual = null;
    const sinStore = await montar();
    await act(async () => {
      sinStore.hook.result.current.setDescription('x');
      await sinStore.hook.result.current.handleShareSubmit();
    });
    expect(onShare).not.toHaveBeenCalled();
  });
});

describe('handleRemoteSubmit', () => {
  it('sends the scrubbed report, thanks the owner, and closes after a beat', async () => {
    const sendBugReport = vi.fn(async () => undefined);
    const { hook, onClose } = await montar({ remote: { sendBugReport } });
    await act(async () => {
      await hook.result.current.handleRemoteSubmit();
    });
    expect(sendBugReport).toHaveBeenCalledTimes(1);
    const payload = sendBugReport.mock.calls[0]?.[0] as { snapshot: typeof snapshot };
    expect(payload.snapshot.errors[0]?.errorStack).toBeUndefined();
    expect(hook.result.current.statusMessage).toBe('✓ Reporte enviado');
    expect(hook.result.current.description).toBe('');
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1600);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a failure says so and points at the share fallback, without closing', async () => {
    const sendBugReport = vi.fn(async () => {
      throw new Error('red');
    });
    const { hook, onClose } = await montar({ remote: { sendBugReport } });
    await act(async () => {
      await hook.result.current.handleRemoteSubmit();
    });
    expect(hook.result.current.statusMessage).toBe(
      'No se pudo enviar. Intenta compartir como archivo.',
    );
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('with no remote configured it is a no-op, whatever the description', async () => {
    const { hook, onClose } = await montar();
    await act(async () => {
      await hook.result.current.handleRemoteSubmit();
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(hook.result.current.statusMessage).toBeUndefined();
  });
});

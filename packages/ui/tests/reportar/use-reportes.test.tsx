import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queuedReports, type SendOutcome } from '@xangarro/application';
import type { BugReportRequest } from '@xangarro/contracts';

/**
 * Sending from the sheet (M-23): the payload carries the tap, the sentence,
 * the error the sheet was opened from, the build and a scrubbed snapshot with
 * no stack trace; without a connection the report waits on the device, is
 * counted, and leaves when the connection returns.
 */
const kv = new Map<string, string>();
const store = {
  get: async (key: string) => kv.get(key) ?? null,
  set: async (key: string, value: string) => void kv.set(key, value),
};
const sent: BugReportRequest[] = [];
let answer: SendOutcome = 'sent';
let sender: { send: (r: BugReportRequest) => Promise<SendOutcome> } | null;
let lastSyncAt: string | null = null;
const exportSnapshot = vi.fn();

vi.mock('../../src/observability/bug-report-sender', () => ({
  useBugReportSender: () => sender,
}));
vi.mock('../../src/app/repository-provider', () => ({
  useAppConfigRepository: () => store,
}));
vi.mock('../../src/observability/observability-provider', () => ({
  useLogStore: () => ({ exportSnapshot }),
}));
vi.mock('../../src/app/cloud-sync-bridge', () => ({
  useCloudSync: () => ({ state: { phase: 'idle', lastSyncAt } }),
}));

import {
  useDrenarReportes,
  useEnviarReporte,
  useReportesPorEnviar,
} from '../../src/reportar/use-reportes';

const EVENT_ID = '9f2c41d0a7b84e3c95d1f0a2b6c7e41a';
const DEVICE = {
  model: 'iPhone 13',
  osName: 'iOS',
  osVersion: '18.5',
  appVersion: '1.4.0',
  platform: 'ios',
};

// One client per test: a wrapper that made its own on every render would
// hand each render a fresh, empty cache.
let client: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  kv.clear();
  sent.length = 0;
  answer = 'sent';
  lastSyncAt = null;
  sender = {
    send: async (r) => {
      sent.push(r);
      return answer;
    },
  };
  exportSnapshot.mockReset();
  exportSnapshot.mockResolvedValue({
    exportedAt: '',
    deviceId: 'd',
    auditEvents: [
      { action: 'venta.registrada', timestamp: 't', metadata: { clienteNombre: 'Ana' } },
    ],
    errors: [{ name: 'TypeError', timestamp: 't', errorStack: 'at cobrar (cobro.ts:1)' }],
  });
});

describe('useEnviarReporte', () => {
  it('sends what was tapped and written, the error it names, and the build', async () => {
    const { result } = renderHook(() => useEnviarReporte(DEVICE as never), { wrapper });
    const outcome = await result.current({
      category: 'froze_or_closed',
      description: '  Se cerró sola  ',
      eventId: EVENT_ID,
    });
    expect(outcome).toBe('sent');
    expect(sent[0]).toMatchObject({
      category: 'froze_or_closed',
      description: 'Se cerró sola',
      eventId: EVENT_ID,
      appVersion: '1.4.0',
      deviceModel: 'iPhone 13',
    });
    expect(Date.parse(sent[0]?.submittedAt ?? '')).not.toBeNaN();
  });

  it('never attaches a stack trace, and omits an event id it was not given', async () => {
    const { result } = renderHook(() => useEnviarReporte(null), { wrapper });
    await result.current({ category: 'other', description: '' });
    expect(JSON.stringify(sent[0])).not.toContain('cobro.ts');
    expect(sent[0]?.snapshot?.errors).toHaveLength(1);
    expect('eventId' in (sent[0] ?? {})).toBe(false);
  });

  it('keeps the report on the device without a connection, and counts it', async () => {
    answer = 'offline';
    const { result } = renderHook(
      () => ({ enviar: useEnviarReporte(null), cuenta: useReportesPorEnviar() }),
      { wrapper },
    );
    let outcome = '';
    await act(async () => {
      outcome = await result.current.enviar({ category: 'could_not_charge', description: '' });
    });
    expect(outcome).toBe('queued');
    expect(await queuedReports(store)).toHaveLength(1);
    await waitFor(() => expect(result.current.cuenta).toBe(1));
  });

  it('fails plainly when the caja has nobody to send as, or the snapshot cannot be read', async () => {
    exportSnapshot.mockRejectedValue(new Error('db closed'));
    const broken = renderHook(() => useEnviarReporte(null), { wrapper });
    expect(await broken.result.current({ category: 'other', description: '' })).toBe('failed');
    sender = null;
    const unlinked = renderHook(() => useEnviarReporte(null), { wrapper });
    expect(await unlinked.result.current({ category: 'other', description: '' })).toBe('failed');
    expect(sent).toHaveLength(0);
  });
});

describe('useDrenarReportes', () => {
  it('sends what waited once a sync run reaches the server, and not before', async () => {
    answer = 'offline';
    const { result, rerender } = renderHook(
      () => {
        useDrenarReportes();
        return { enviar: useEnviarReporte(null), cuenta: useReportesPorEnviar() };
      },
      { wrapper },
    );
    await act(async () => {
      await result.current.enviar({ category: 'wrong_number', description: '' });
    });
    await waitFor(() => expect(result.current.cuenta).toBe(1));
    expect(sent).toHaveLength(1);
    answer = 'sent';
    lastSyncAt = '2026-11-20T20:20:00.000Z';
    rerender();
    await waitFor(() => expect(result.current.cuenta).toBe(0));
    expect(sent).toHaveLength(2);
    expect(await queuedReports(store)).toHaveLength(0);
  });
});

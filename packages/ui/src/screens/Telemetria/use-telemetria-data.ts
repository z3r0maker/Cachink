/**
 * useTelemetriaData / useTelemetriaStats — data hooks for the Telemetría screen.
 *
 * Queries the LogStore with filters and refreshes on interval for
 * live-tailing in development.
 */

import { useQuery } from '@tanstack/react-query';
import type { LogQueryOptions, TimelineEntry, LogStats } from '@cachink/observability';
import { useRequiredLogStore } from '../../observability/observability-provider';

export type TelemetriaFilter = 'all' | 'audit' | 'error';
export type TelemetriaPeriod = 'today' | '7d' | '30d';

export interface TelemetriaQueryOpts {
  readonly filter: TelemetriaFilter;
  readonly period: TelemetriaPeriod;
  readonly operation?: string;
}

function periodToSince(period: TelemetriaPeriod): string {
  const now = new Date();
  switch (period) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return start.toISOString();
    }
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }
}

export function useTelemetriaData(opts: TelemetriaQueryOpts) {
  const logStore = useRequiredLogStore();

  return useQuery<readonly TimelineEntry[]>({
    queryKey: ['telemetria', opts.filter, opts.period, opts.operation],
    async queryFn() {
      const since = periodToSince(opts.period);
      const queryOpts: LogQueryOptions = { since, limit: 200 };
      if (opts.operation) queryOpts.operation = opts.operation;

      switch (opts.filter) {
        case 'audit':
          return (await logStore.queryAudit(queryOpts)).map((e) => ({ type: 'audit' as const, ...e }));
        case 'error':
          return (await logStore.queryErrors(queryOpts)).map((e) => ({ type: 'error' as const, ...e }));
        default:
          return logStore.queryTimeline(queryOpts);
      }
    },
    refetchInterval: 5_000,
  });
}

export function useTelemetriaStats() {
  const logStore = useRequiredLogStore();

  return useQuery<LogStats>({
    queryKey: ['telemetria-stats'],
    async queryFn() {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return logStore.stats(todayStart.toISOString());
    },
    refetchInterval: 10_000,
  });
}

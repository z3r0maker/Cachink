import type { SupportItem } from '@xangarro/domain';

import { formatMetric } from '@/server/capacity/labels';
import { snapshotOf, type CapacityReading } from '@/server/capacity/port';
import {
  CAPACITY_TRIGGERS,
  capacityMetrics,
  type CapacityMetricKey,
  type CapacityStatus,
} from '@/server/capacity/status';
import { capacityNow, OPEN_ITEMS_CAP, openInboxItems } from '@/server/torre/readings';

import { Clock } from './clock';
import { CommandPalette } from './palette';
import { clock, env, envQuiet, led, reading, status, type Led } from './shell.css';

const LED: Readonly<Record<CapacityStatus, Led>> = {
  ok: 'ok',
  amber: 'warn',
  red: 'bad',
  'sin-datos': 'off',
};

function environment(): { readonly label: string; readonly prod: boolean } {
  const v = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  if (v === 'production') return { label: 'PROD', prod: true };
  if (v === 'preview') return { label: 'PREVIEW', prod: false };
  return { label: 'LOCAL', prod: false };
}

function Reading({ light, children }: { readonly light: Led; readonly children: React.ReactNode }) {
  return (
    <span className={reading}>
      <span className={led[light]} aria-hidden="true" />
      {children}
    </span>
  );
}

function CapacityReadings({ reading }: { readonly reading: CapacityReading | null }) {
  if (reading === null) return <Reading light="bad">Capacidad · no se pudo medir</Reading>;
  const metrics = capacityMetrics(snapshotOf(reading));
  const byKey = new Map(metrics.map((m) => [m.key, m]));
  const show = (key: CapacityMetricKey, text: (v: string) => string) => {
    const m = byKey.get(key);
    if (m === undefined) return null;
    const v = m.value === null ? '—' : formatMetric(key, m.value);
    return <Reading light={LED[m.status]}>{text(v)}</Reading>;
  };
  return (
    <>
      {show(
        'dbSizeS2',
        (v) => `Base ${v} / ${formatMetric('dbSizeS2', CAPACITY_TRIGGERS.dbBytesS2)}`,
      )}
      {show('largestTableRows', (v) => `Tabla mayor ${v} filas`)}
      {show('syncP95', (v) => (v === '—' ? 'Sync p95 — llega con B-18' : `Sync p95 ${v}`))}
    </>
  );
}

function InboxReading({ open }: { readonly open: readonly SupportItem[] | null }) {
  if (open === null) return <Reading light="off">Inbox sin datos</Reading>;
  const urgent = open.filter((i) => i.urgent).length;
  const count = open.length >= OPEN_ITEMS_CAP ? `${OPEN_ITEMS_CAP}+` : String(open.length);
  const light: Led = urgent > 0 ? 'bad' : open.length > 0 ? 'warn' : 'ok';
  return (
    <Reading light={light}>
      Inbox {count} abiertos{urgent > 0 ? ` · ${urgent} urgentes` : ''}
    </Reading>
  );
}

/**
 * The strip across the top of every console page: which environment you are
 * in, the database against its S2 triggers, the inbox, and the CDMX clock.
 */
export async function StatusBar() {
  const [cap, open] = await Promise.all([capacityNow(), openInboxItems()]);
  const e = environment();
  return (
    <div className={status} role="status" aria-label="Estado del sistema">
      <span className={e.prod ? env : `${env} ${envQuiet}`}>{e.label}</span>
      <CapacityReadings reading={cap} />
      <InboxReading open={open} />
      <CommandPalette />
      <Clock className={clock} />
    </div>
  );
}

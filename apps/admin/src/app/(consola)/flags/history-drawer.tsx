import Link from 'next/link';
import type { PlatformFlagKey } from '@xangarro/domain';

import { db } from '@/server/db/client';
import { FLAG_COPY, MODE_LABELS } from '@/server/flags/labels';
import { flagHistory, HISTORY_LIMIT } from '@/server/flags/overview';
import { flagDeps } from '@/server/flags/wiring';
import { heading, muted } from '@/styles/ui.css';

import { sub } from '../tenants/tenants.css';
import { drawer, eventItem, events, mode } from './flags.css';

const when = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Mexico_City',
});

/** Every change to one key, newest first — opened by `?historial=<key>`. */
export async function HistoryDrawer({ flagKey }: { readonly flagKey: PlatformFlagKey }) {
  const entries = await flagHistory(flagDeps(db()), flagKey);
  return (
    <aside className={drawer} aria-labelledby="flag-history-title">
      <h2 id="flag-history-title" className={heading}>
        Historial: {FLAG_COPY[flagKey].nombre}
      </h2>
      <Link href="/flags">Cerrar</Link>
      {entries.length === 0 ? (
        <p className={muted}>Nunca se ha cambiado: rige el valor del código.</p>
      ) : (
        <ol className={events}>
          {entries.map((e) => (
            <li key={e.id} className={eventItem}>
              <span className={mode[e.mode]}>{MODE_LABELS[e.mode]}</span>{' '}
              {when.format(new Date(e.updatedAt))} · {e.by}
              <span className={sub}>«{e.reason}»</span>
              {e.mode === 'allowlist' ? (
                <span className={sub}>{e.allowlistBusinessIds.join(', ')}</span>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      {entries.length === HISTORY_LIMIT ? (
        <p className={muted}>Se muestran los {HISTORY_LIMIT} cambios más recientes.</p>
      ) : null}
    </aside>
  );
}

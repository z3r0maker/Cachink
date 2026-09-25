import type { Route } from 'next';
import Link from 'next/link';

import { DonPortrait } from '@/components/don-cuentas/don-cuentas';
import type { AuditEntry } from '@/server/db/audit-feed';
import type { Briefing, Mood } from '@/server/torre/briefing';
import * as u from '@/styles/torre.css';

import * as s from './inicio.css';

const MOOD_LABEL: Readonly<Record<Mood, string>> = {
  guardia: 'de guardia',
  tranquilo: 'tranquilo',
  alarma: 'alarma',
};

export function BriefCard({ b }: { readonly b: Briefing }) {
  const first = b.items[0];
  return (
    <section className={`${s.brief} ${s.briefTone[b.mood]}`} aria-labelledby="brief-title">
      <DonPortrait mood={b.mood} large />
      <div className={s.briefBody}>
        <span id="brief-title" className={`${u.eyebrow} ${s.moodLabel[b.mood]}`}>
          Don Cuentas · {MOOD_LABEL[b.mood]}
        </span>
        <p className={s.briefLine}>{b.line}</p>
        <div className={s.actions}>
          {first === undefined ? (
            <Link className={u.linkButton} href="/capacidad">
              Ver capacidad
            </Link>
          ) : (
            <Link className={u.linkPrimary} href={first.href as Route}>
              {first.action}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function Kpi({
  label,
  value,
  sub,
}: {
  readonly label: string;
  readonly value: string;
  readonly sub: string;
}) {
  return (
    <section className={u.kpi} aria-label={label}>
      <span className={u.eyebrow}>{label}</span>
      <span className={u.kpiValue}>{value}</span>
      <span className={u.kpiSub}>{sub}</span>
    </section>
  );
}

export function Attention({ b }: { readonly b: Briefing }) {
  return (
    <section className={u.panel} aria-labelledby="atencion-title">
      <div className={u.panelHead}>
        <h2 id="atencion-title" className={u.panelTitle}>
          Requiere atención
        </h2>
        <span className={u.faint}>{b.items.length} · por gravedad</span>
      </div>
      {b.items.length === 0 ? (
        <p className={s.empty}>Nada pendiente. Don Cuentas ya subió los pies al escritorio.</p>
      ) : (
        <ol className={u.list}>
          {b.items.map((it, i) => (
            <li key={`${it.href}-${it.title}`} className={`${u.row} ${s.attentionRow}`}>
              <span className={u.faint}>{String(i + 1).padStart(2, '0')}</span>
              <span className={u.sev[it.severity]}>{it.severity}</span>
              <span>
                <span className={u.rowTitle}>{it.title}</span>
                <span className={u.rowDetail}>{it.detail}</span>
              </span>
              <Link className={u.linkButton} href={it.href as Route}>
                {it.action}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const WHEN = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function Bitacora({
  entries,
  children,
}: {
  readonly entries: readonly AuditEntry[] | null;
  readonly children: React.ReactNode;
}) {
  return (
    <section className={u.panel} aria-labelledby="bitacora-title">
      <div className={u.panelHead}>
        <h2 id="bitacora-title" className={u.panelTitle}>
          Bitácora
        </h2>
        <span className={u.faint}>lo último que hizo el equipo</span>
      </div>
      {entries === null || entries.length === 0 ? (
        <p className={s.empty}>
          {entries === null ? 'No se pudo leer la bitácora.' : 'Nadie ha movido nada todavía.'}
        </p>
      ) : (
        <ol className={u.list}>
          {entries.map((e) => (
            <li key={e.id} className={`${u.row} ${s.feedRow}`}>
              <span className={`${u.faint} ${s.time}`}>{WHEN.format(new Date(e.at))}</span>
              <span>
                <span className={`${u.rowTitle} ${u.mono}`}>{e.action}</span>
                <span className={u.rowDetail}>{e.staffEmail}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className={s.review}>{children}</div>
    </section>
  );
}

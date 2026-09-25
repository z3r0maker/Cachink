'use client';

import { colors } from '@xangarro/tokens';
import type { Capacidad } from '@xangarro/domain';

import { Button, Card, DON_CUENTAS, DonCuentasAvatar, StatusPill, Tag } from '@/components';
import { cerrarAvisoAsesor } from '@/server/actions/asesor';
import type { AvisosData } from '@/server/screens';
import { useSession } from '@/session/provider';
import { canWrite } from '@/session/gating';
import { eyebrow } from '@/styles/text.css';

import {
  barFill,
  barTrack,
  capName,
  capReq,
  capRow,
  feedBody,
  feedLink,
  feedRow,
  feedTile,
  feedTitle,
  provenance,
} from './asesor.css';

type Aviso = AvisosData[number];

function FeedRow({ n, mayAct }: { readonly n: Aviso; readonly mayAct: boolean }) {
  const act = (accion: 'resolver' | 'descartar') => {
    void cerrarAvisoAsesor(n.id, accion);
  };
  return (
    <div className={feedRow} data-testid="asesor-feed-row">
      <span className={feedTile} style={{ background: colors.peachSoft }} aria-hidden="true">
        ✦
      </span>
      <span style={{ minWidth: 0 }}>
        <span className={feedTitle}>{n.title}</span>
        <span className={feedBody}>{n.body}</span>
      </span>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a className={feedLink} href={n.ctaHref ?? '#'}>
          <Button size="sm" variant="secondary">
            {n.ctaLabel ?? 'Ver'}
          </Button>
        </a>
        {mayAct ? (
          <>
            <Button size="sm" variant="ghost" onClick={() => act('descartar')}>
              Descartar
            </Button>
            <Button size="sm" variant="dark" onClick={() => act('resolver')}>
              Listo
            </Button>
          </>
        ) : null}
      </span>
    </div>
  );
}

/**
 * "Para ti" — the insight feed. Reads `notices` where `source='asesor'`
 * (ADR-060): the deterministic layer materialises them on read (ADR-088), so
 * every card here is **computed from this tenant's rows**, never written by a
 * model, and the footer says so.
 */
export function ParaTi({ insights }: { readonly insights: AvisosData | null }) {
  const session = useSession();
  const rows = insights ?? [];
  return (
    <Card>
      <div className={eyebrow}>Para ti hoy</div>
      {rows.length === 0 ? (
        <p className={feedBody} style={{ padding: '12px 0' }}>
          Todo va bien: no hay nada que tus números te estén pidiendo hoy.
        </p>
      ) : (
        rows.map((n) => <FeedRow key={n.id} n={n} mayAct={canWrite(session.role)} />)
      )}
      <p className={provenance}>
        <DonCuentasAvatar size="sm" /> {DON_CUENTAS} · Calculado a partir de tus registros.
      </p>
    </Card>
  );
}

/**
 * Capacidades — what the Asesor can and cannot yet say, from the tenant's own
 * counts. A locked capability shows **progress toward the data it needs**,
 * never invented text: the Fase 6 compuerta.
 */
export function Capacidades({ capacidades }: { readonly capacidades: readonly Capacidad[] }) {
  return (
    <Card>
      <div className={eyebrow}>Lo que Don Cuentas ya puede ver</div>
      {capacidades.map((c) => (
        <div key={c.name} className={capRow}>
          <span style={{ minWidth: 0 }}>
            <span className={capName}>{c.name}</span>
            <span className={capReq}>{c.requirement}</span>
          </span>
          <span className={barTrack} aria-hidden="true">
            <span
              className={barFill}
              style={{ width: `${c.pct}%`, background: c.locked ? colors.warning : colors.green }}
            />
          </span>
          <span style={{ minWidth: 120, textAlign: 'right' }}>
            {c.locked ? (
              <Tag tone="neutral">{c.progress}</Tag>
            ) : (
              <StatusPill tone="success">Activo</StatusPill>
            )}
          </span>
        </div>
      ))}
    </Card>
  );
}

/** Closed rows — «Listo» when dealt with, «Descartado» when dismissed. */
export function Anteriores({ anteriores }: { readonly anteriores: AvisosData }) {
  if (anteriores.length === 0) return null;
  return (
    <Card>
      <div className={eyebrow}>Anteriores</div>
      {anteriores.map((p) => (
        <div key={p.id} className={capRow}>
          <span style={{ minWidth: 0 }}>
            <span className={capName}>{p.title}</span>
          </span>
          <span style={{ marginLeft: 'auto' }}>
            <Tag tone={p.state === 'listo' ? 'success' : 'neutral'}>
              {p.state === 'listo' ? 'Listo' : 'Descartado'}
            </Tag>
          </span>
        </div>
      ))}
    </Card>
  );
}

'use client';

import { colors } from '@xangarro/tokens';

import { Button, Card, StatusPill, Tag } from '@/components';
import { CAPACIDADES, PREVIOS } from '@/fixtures/asesor';
import type { AvisosData } from '@/server/screens';
import { eyebrow } from '@/styles/text.css';

import {
  barFill,
  barTrack,
  capName,
  capReq,
  capRow,
  feedBody,
  feedRow,
  feedTile,
  feedTitle,
  provenance,
} from './asesor.css';

/**
 * "Para ti" — the insight feed.
 *
 * Reads `notices` where `source='asesor'` (ADR-060). Every card here is
 * **computed**, not written by a model: cost deltas, category baselines,
 * staleness windows, duplicate detection. The footer says so.
 */
export function ParaTi({ insights }: { readonly insights: AvisosData | null }) {
  const rows = insights ?? [];
  return (
    <Card>
      <div className={eyebrow}>Para ti hoy</div>
      {rows.map((n) => (
        <div key={n.id} className={feedRow}>
          <span className={feedTile} style={{ background: colors.peachSoft }} aria-hidden="true">
            ✦
          </span>
          <span style={{ minWidth: 0 }}>
            <span className={feedTitle}>{n.title}</span>
            <span className={feedBody}>{n.body}</span>
          </span>
          <span style={{ marginLeft: 'auto' }}>
            <Button size="sm" variant="secondary">
              {n.ctaLabel ?? 'Ver'}
            </Button>
          </span>
        </div>
      ))}
      <p className={provenance}>
        <Tag tone="soft">Asesor</Tag> Calculado a partir de tus registros.
      </p>
    </Card>
  );
}

/**
 * Capacidades — what the Asesor can and cannot yet say.
 *
 * A locked capability shows **progress toward the data it needs**, never
 * invented text. That is the Fase 6 compuerta: "Ninguna conclusión aparece sin
 * datos suficientes."
 */
export function Capacidades() {
  return (
    <Card>
      <div className={eyebrow}>Lo que tu Asesor ya puede ver</div>
      {CAPACIDADES.map((c) => (
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

export function Anteriores() {
  return (
    <Card>
      <div className={eyebrow}>Anteriores</div>
      {PREVIOS.map((p) => (
        <div key={p.title} className={capRow}>
          <span style={{ minWidth: 0 }}>
            <span className={capName}>{p.title}</span>
            <span className={capReq}>{p.when}</span>
          </span>
          <span style={{ marginLeft: 'auto' }}>
            <Tag tone={p.outcome === 'Listo' ? 'success' : 'neutral'}>{p.outcome}</Tag>
          </span>
        </div>
      ))}
    </Card>
  );
}

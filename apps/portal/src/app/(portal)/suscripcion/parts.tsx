'use client';

import { colors } from '@xangarro/tokens';

import { Button, Card, Tag } from '@/components';
import { cardTitle, eyebrow, muted, planLabel } from '@/styles/text.css';
import type { AsesorTier, Invoice } from '@/fixtures/planes';

import { featureMark, featureRow, planCard, planGrid } from './suscripcion.css';

function AsesorTierCard({ t }: { readonly t: AsesorTier }) {
  return (
    <div className={t.emphasis ? planCard.emphasis : planCard.plain}>
      <div className={planLabel} style={{ color: t.emphasis ? colors.yellow : colors.gray600 }}>
        {t.name}
      </div>
      <p
        style={{
          margin: '10px 0 18px',
          fontWeight: 700,
          color: t.emphasis ? colors.white : colors.black,
        }}
      >
        {t.oneLiner}
      </p>
      {t.items.map((item) => (
        <div key={item} className={featureRow}>
          <span
            className={featureMark}
            style={{ color: t.emphasis ? colors.yellow : colors.greenText }}
            aria-hidden="true"
          >
            ✓
          </span>
          <span style={{ color: t.emphasis ? colors.gray200 : colors.ink }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

/** The Asesor is sold as its own block, separate from the plan feature lists. */
export function AsesorBlock({ tiers }: { readonly tiers: readonly AsesorTier[] }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span className={eyebrow} style={{ color: colors.gray600 }}>
          Asesor en cada plan
        </span>
        <Tag tone="soft">Asesor</Tag>
      </div>
      <div className={planGrid}>
        {tiers.map((t) => (
          <AsesorTierCard key={t.name} t={t} />
        ))}
      </div>
    </div>
  );
}

export function Comprobantes({ invoices }: { readonly invoices: readonly Invoice[] }) {
  return (
    <Card>
      <div className={cardTitle} style={{ marginBottom: 16 }}>
        Comprobantes
      </div>
      {invoices.map((i) => (
        <div
          key={i.folio}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 0',
            borderBottom: `2px solid ${colors.gray200}`,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{i.date}</div>
            <div className={muted}>{i.folio}</div>
          </div>
          <span style={{ marginLeft: 'auto' }}>
            <Tag tone="success">{i.state}</Tag>
          </span>
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{i.amount}</strong>
          <Button size="sm" variant="secondary">
            Descargar
          </Button>
        </div>
      ))}
    </Card>
  );
}

export function PauseRow() {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <strong>¿Quieres pausar tu suscripción?</strong>
          <div style={{ color: colors.textMuted, fontWeight: 600 }}>
            Bajas al plan Xangarrito y conservas tus registros. Puedes volver cuando quieras.
          </div>
        </div>
        <span style={{ marginLeft: 'auto' }}>
          <Button variant="danger" size="sm">
            Cambiar a Xangarrito
          </Button>
        </span>
      </div>
    </Card>
  );
}

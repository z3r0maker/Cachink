'use client';

import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import { Button, Card, Tag, Verdict } from '@/components';
import { LEVELS, PACE_COPY, TROPHIES } from '@/fixtures/asesor';
import { eyebrow } from '@/styles/text.css';

import { Wizard } from './wizard';
import { capName, capReq, capRow, goalFigure } from './asesor.css';

function Trophies() {
  return (
    <Card>
      <div className={eyebrow}>Metas anteriores</div>
      {TROPHIES.map((t) => (
        <div key={t.month} className={capRow}>
          <span style={{ minWidth: 0 }}>
            <span className={capName}>{t.month}</span>
            <span className={capReq}>{t.goal}</span>
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{t.result}</strong>
            <Tag tone={t.achieved ? 'success' : 'neutral'}>
              {t.achieved ? 'Lograda' : 'No lograda'}
            </Tag>
          </span>
        </div>
      ))}
    </Card>
  );
}

function ActiveGoal({ onChange }: { readonly onChange: () => void }) {
  const level = LEVELS.find((l) => l.id === 'reto');
  const pace = PACE_COPY.behind;
  return (
    <>
      <Card tone="hero" emphasis="hero">
        <div className={eyebrow}>Tu meta de mayo</div>
        <p className={goalFigure}>{formatMoney(level?.monthly ?? 0n)}</p>
        <div style={{ fontWeight: 700 }}>Vender más · un reto · +20%</div>
        <div style={{ marginTop: 10 }}>
          <Verdict onYellow tone={pace.tone}>
            {pace.label}
          </Verdict>
        </div>
        <p style={{ margin: '12px 0 0', fontWeight: 600 }}>
          Te faltan $4,100.00. Tu mejor día es el sábado — una promo de quesadillas ahí te acerca.
        </p>
        <div style={{ marginTop: 18 }}>
          <Button variant="dark" onClick={onChange}>
            Cambiar de meta
          </Button>
        </div>
      </Card>
      <Trophies />
    </>
  );
}

/** Metas is deterministic arithmetic, so it ships live in production. */
export function Metas() {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <Wizard onDone={() => setEditing(false)} />
  ) : (
    <ActiveGoal onChange={() => setEditing(true)} />
  );
}

'use client';

import { colors } from '@xangarro/tokens';

import { Card } from '@/components';
import { CAPABILITY_ROWS, type Section } from '@/fixtures/negocio';

import {
  fieldLabel,
  fieldMissing,
  fieldRow,
  fieldValue,
  sectionHead,
  sectionTile,
  sectionTitle,
} from './negocio.css';

const TILE_BG = {
  hero: colors.yellow,
  info: colors.blueSoft,
  peach: colors.peachSoft,
  purple: colors.purpleSoft,
} as const;

export function SectionCard({ section }: { readonly section: Section }) {
  return (
    <Card>
      <div className={sectionHead}>
        <span
          className={sectionTile}
          style={{ background: TILE_BG[section.tone] }}
          aria-hidden="true"
        />
        <span className={sectionTitle}>{section.title}</span>
      </div>
      {section.fields.map((f) => (
        <div key={f.label} className={fieldRow}>
          <span className={fieldLabel}>{f.label}</span>
          <span className={f.value === null ? fieldMissing : fieldValue}>
            {f.value ?? 'Falta por completar'}
          </span>
        </div>
      ))}
    </Card>
  );
}

/** Plan capabilities have no tenant switch, so they render without one. */
export function CapabilitiesCard() {
  return (
    <Card>
      <div className={sectionTitle} style={{ marginBottom: 6 }}>
        Tu plan incluye
      </div>
      <p className={fieldLabel} style={{ marginBottom: 14 }}>
        Esto viene con tu plan. No se activa ni se apaga desde aquí.
      </p>
      {CAPABILITY_ROWS.map(([label, value]) => (
        <div key={label} className={fieldRow}>
          <span className={fieldLabel}>{label}</span>
          <span className={fieldValue}>{value}</span>
        </div>
      ))}
    </Card>
  );
}

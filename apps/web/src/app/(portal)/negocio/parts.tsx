'use client';

import { colors } from '@xangarro/tokens';

import { Card } from '@/components';
import { CAPABILITY_ROWS, type Section } from '@/data/negocio';

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

/** A section's card with its icon tile — read mode fills it with rows, edit mode with inputs. */
export function SectionShell(props: {
  readonly title: string;
  readonly tone: Section['tone'];
  readonly children: React.ReactNode;
}) {
  return (
    <Card>
      <div className={sectionHead}>
        <span
          className={sectionTile}
          style={{ background: TILE_BG[props.tone] }}
          aria-hidden="true"
        />
        <span className={sectionTitle}>{props.title}</span>
      </div>
      {props.children}
    </Card>
  );
}

export function FieldRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | null;
}) {
  return (
    <div className={fieldRow}>
      <span className={fieldLabel}>{label}</span>
      <span className={value === null ? fieldMissing : fieldValue}>
        {value ?? 'Falta por completar'}
      </span>
    </div>
  );
}

export function SectionCard({ section }: { readonly section: Section }) {
  return (
    <SectionShell title={section.title} tone={section.tone}>
      {section.fields.map((f) => (
        <FieldRow key={f.label} label={f.label} value={f.value} />
      ))}
    </SectionShell>
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

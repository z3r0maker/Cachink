'use client';

import { colors } from '@xangarro/tokens';

import { Card, StatusPill, Tag } from '@/components';
import {
  CAPABILITY_ROWS,
  FLAG_DESC,
  FLAG_LABEL,
  FLAG_ROWS,
  type FlagRow,
  type Section,
} from '@/fixtures/negocio';
import { eyebrow } from '@/styles/text.css';

import {
  cell,
  colLabel,
  fieldLabel,
  fieldMissing,
  fieldRow,
  fieldValue,
  flagHead,
  flagRow,
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

/**
 * Funciones (P-15) — the three levels, rendered as three columns.
 *
 * The switch is editable only when **disponible** and **en tu plan** are both
 * true. A key that is not available on the platform reads "Próximamente" and
 * cannot be toggled; the server rejects it regardless (F-06).
 */
function FlagLine({ r }: { readonly r: FlagRow }) {
  const editable = r.disponible && r.enTuPlan;
  return (
    <div className={flagRow}>
      <span>
        <span style={{ fontWeight: 800, display: 'block' }}>{FLAG_LABEL[r.key]}</span>
        <span className={fieldLabel}>{FLAG_DESC[r.key]}</span>
      </span>
      <span className={cell}>
        {r.disponible ? <Tag tone="success">Sí</Tag> : <Tag tone="neutral">Próximamente</Tag>}
      </span>
      <span className={cell}>
        {r.enTuPlan ? <Tag tone="success">Sí</Tag> : <Tag tone="neutral">No</Tag>}
      </span>
      <span className={cell}>
        {editable ? (
          <StatusPill tone={r.activada ? 'success' : 'neutral'}>
            {r.activada ? 'Activada' : 'Apagada'}
          </StatusPill>
        ) : (
          <Tag tone="neutral">—</Tag>
        )}
      </span>
    </div>
  );
}

export function FuncionesCard() {
  return (
    <Card>
      <div className={sectionTitle} style={{ marginBottom: 6 }}>
        Funciones del negocio
      </div>
      <p className={fieldLabel} style={{ marginBottom: 14 }}>
        Activa o desactiva las funciones que necesita tu negocio.
      </p>
      <div className={flagHead}>
        <span className={eyebrow}>Función</span>
        <span className={colLabel}>Disponible</span>
        <span className={colLabel}>En tu plan</span>
        <span className={colLabel}>Activada</span>
      </div>
      {FLAG_ROWS.map((r) => (
        <FlagLine key={r.key} r={r} />
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

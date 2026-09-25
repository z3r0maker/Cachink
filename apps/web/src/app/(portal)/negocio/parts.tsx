'use client';

import { colors } from '@xangarro/tokens';

import { useSession } from '@/session/provider';
import { Card } from '@/components';
import { capabilityRows, type Section } from '@/data/negocio';
import { Icon } from '@/shell/icon';

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

/**
 * Each tile carries a 19px stroked glyph — the design draws one per section
 * and ours were empty coloured squares (D-1). The storefront and the receipt
 * are the design's own paths; the card and the gear are the nearest reading
 * of what our two extra sections hold (formas de pago, atributos).
 */
const TILE_ICON = {
  hero: 'M4 9h16v11H4V9Zm0 0 2-5h12l2 5M9 20v-6h6v6',
  info: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6',
  peach: 'M3 7h18v11H3V7Zm0 4h18M7 15h4',
  purple:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7.4 7.4 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7.4 7.4 0 0 0-2 1.2l-2.4-1-2 3.5 2 1.5A7.4 7.4 0 0 0 5.6 12',
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
        <span className={sectionTile} style={{ background: TILE_BG[props.tone] }}>
          <Icon path={TILE_ICON[props.tone]} size={19} strokeWidth={2.3} />
        </span>
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
  const rows = capabilityRows(useSession().planId);
  return (
    <Card>
      <div className={sectionTitle} style={{ marginBottom: 6 }}>
        Tu plan incluye
      </div>
      <p className={fieldLabel} style={{ marginBottom: 14 }}>
        Esto viene con tu plan. No se activa ni se apaga desde aquí.
      </p>
      {rows.map(([label, value]) => (
        <div key={label} className={fieldRow}>
          <span className={fieldLabel}>{label}</span>
          <span className={fieldValue}>{value}</span>
        </div>
      ))}
    </Card>
  );
}

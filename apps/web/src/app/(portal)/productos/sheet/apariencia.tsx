'use client';

import type { ProductColor } from '@xangarro/domain';
import { productTints } from '@xangarro/tokens';

import { ProductGlyph } from '@/components/product-glyph';
import { adivinaIcono } from '@/lib/adivina-icono';
import { eyebrow } from '@/styles/text.css';

import { IconoPicker } from './icono-picker';
import { chipRow, preview, section, swatch } from './sheet.css';
import type { SectionProps } from './sections';

/**
 * Apariencia (P-07): the tile a phone's caja shows for this product — one of
 * eight tints and one of the phone's icons (`productTints`, `ProductIconEnum`),
 * with a live preview. ADR-107 dropped the icon category tabs.
 */
const TINTS = productTints satisfies Record<ProductColor, { hex: string; label: string }>;

export function Swatches({ draft, set }: SectionProps) {
  return (
    <div className={chipRow} role="radiogroup" aria-label="Color del producto">
      {(Object.keys(TINTS) as ProductColor[]).map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={draft.colorFondo === c}
          aria-label={TINTS[c].label}
          className={swatch}
          style={{ background: TINTS[c].hex }}
          onClick={() => set({ colorFondo: c })}
        />
      ))}
    </div>
  );
}

export function Apariencia(props: SectionProps) {
  const { draft } = props;
  return (
    <div className={section}>
      <span className={eyebrow}>Apariencia</span>
      <Swatches {...props} />
      <IconoPicker
        nombre={draft.nombre}
        icono={draft.icono}
        onPick={(icono) => props.set({ icono })}
      />
      <div
        className={preview}
        style={{ background: TINTS[draft.colorFondo].hex }}
        data-testid="producto-preview"
      >
        <ProductGlyph icon={draft.icono ?? adivinaIcono(draft.nombre)} size={32} />
        <span>{draft.nombre.trim() || 'Tu producto'}</span>
      </div>
    </div>
  );
}

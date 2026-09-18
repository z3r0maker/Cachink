'use client';

import { ICON_CATEGORIES, type ProductColor, type ProductIcon } from '@xangarro/domain';
import { productTints } from '@xangarro/tokens';
import { useState } from 'react';

import { SegmentedTabs } from '@/components';
import { ProductGlyph } from '@/components/product-glyph';
import { eyebrow } from '@/styles/text.css';

import { chipRow, iconButton, iconGrid, preview, section, swatch } from './sheet.css';
import type { SectionProps } from './sections';

/**
 * Apariencia (P-07): the tile a phone's caja shows for this product — one of
 * eight tints and one of 66 icons in 7 tabs, both lists shared with the phone
 * (`productTints`, `ICON_CATEGORIES`), with a live preview.
 */
const TINTS = productTints satisfies Record<ProductColor, { hex: string; label: string }>;

function Swatches({ draft, set }: SectionProps) {
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

function IconPicker({ draft, set }: SectionProps) {
  const [tab, setTab] = useState(ICON_CATEGORIES[0]?.key ?? '');
  const icons = ICON_CATEGORIES.find((c) => c.key === tab)?.icons ?? [];
  const pick = (icon: ProductIcon) => set({ icono: draft.icono === icon ? null : icon });
  return (
    <>
      <SegmentedTabs
        ariaLabel="Categorías de iconos"
        value={tab}
        onValueChange={setTab}
        tabs={ICON_CATEGORIES.map((c) => ({ value: c.key, label: c.label }))}
      />
      <div className={iconGrid} role="radiogroup" aria-label="Icono">
        {icons.map((icon) => (
          <button
            key={icon}
            type="button"
            role="radio"
            aria-checked={draft.icono === icon}
            aria-label={icon}
            className={iconButton}
            onClick={() => pick(icon)}
          >
            <ProductGlyph icon={icon} />
          </button>
        ))}
      </div>
    </>
  );
}

export function Apariencia(props: SectionProps) {
  const { draft } = props;
  return (
    <div className={section}>
      <span className={eyebrow}>Apariencia</span>
      <Swatches {...props} />
      <IconPicker {...props} />
      <div
        className={preview}
        style={{ background: TINTS[draft.colorFondo].hex }}
        data-testid="producto-preview"
      >
        {draft.icono === null ? null : <ProductGlyph icon={draft.icono} size={32} />}
        <span>{draft.nombre.trim() || 'Tu producto'}</span>
      </div>
    </div>
  );
}

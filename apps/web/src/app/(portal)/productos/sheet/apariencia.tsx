'use client';

import type { ProductColor } from '@xangarro/domain';
import { productTints } from '@xangarro/tokens';
import { useState } from 'react';

import { ProductPhoto } from '@/components/product-photo';
import { adivinaIcono } from '@/lib/adivina-icono';
import { eyebrow, muted } from '@/styles/text.css';

import type { Producto } from '../parts';
import { FotoBloque } from './foto';
import { IconoPicker } from './icono-picker';
import { chipRow, preview, section, swatch } from './sheet.css';
import type { SectionProps } from './sections';

/**
 * Apariencia (P-07): the tile a phone's caja shows for this product — one of
 * eight tints and one of the phone's icons (`productTints`, `ProductIconEnum`),
 * with a live preview. ADR-107 dropped the icon category tabs. Editing a
 * product adds its photo (P-42): the tint is the photo's ground and the icon
 * what shows without one, so both stay.
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

/**
 * The sheet keeps the row it opened with, so a removed photo is remembered
 * here until the drawer closes (the sheet keys this section by product): the
 * draft is never reset, so «Quitar foto» never costs an unsaved edit.
 */
export function Apariencia(props: SectionProps & { readonly producto?: Producto | null }) {
  const { draft } = props;
  const [quitada, setQuitada] = useState(false);
  const producto = props.producto && quitada ? { ...props.producto, foto: null } : props.producto;
  const fondo = TINTS[draft.colorFondo].hex;
  const editando = producto !== null && producto !== undefined;
  return (
    <div className={section}>
      <span className={eyebrow}>Apariencia</span>
      {editando ? (
        <FotoBloque producto={producto} fondo={fondo} onQuitada={() => setQuitada(true)} />
      ) : null}
      {editando ? <span className={muted}>Color: el fondo de la foto</span> : null}
      <Swatches {...props} />
      {editando ? <span className={muted}>Ícono: se ve cuando no hay foto</span> : null}
      <IconoPicker
        nombre={draft.nombre}
        icono={draft.icono}
        onPick={(icono) => props.set({ icono })}
      />
      <Vista draft={draft} producto={producto ?? null} fondo={fondo} />
    </div>
  );
}

/** The live preview: the tile with its photo when it has one, else its icon. */
function Vista(props: {
  readonly draft: SectionProps['draft'];
  readonly producto: Producto | null;
  readonly fondo: string;
}) {
  const { draft, producto } = props;
  return (
    <div className={preview} style={{ background: props.fondo }} data-testid="producto-preview">
      <ProductPhoto
        productoId={producto?.id ?? ''}
        fotoId={producto?.foto?.id ?? null}
        icon={draft.icono ?? adivinaIcono(draft.nombre)}
        glyphSize={32}
        size={64}
        alt=""
      />
      <span>{draft.nombre.trim() || 'Tu producto'}</span>
    </div>
  );
}

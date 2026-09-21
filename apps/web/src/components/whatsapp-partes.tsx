'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { colors, portalFontSizes } from '@xangarro/tokens';

const TILE = {
  width: 40,
  height: 40,
  flex: 'none',
  border: `2px solid ${colors.black}`,
  borderRadius: 11,
  background: colors.yellowSoft,
  display: 'grid',
  placeItems: 'center',
} as const;

const BOTON_X = {
  marginLeft: 'auto',
  fontSize: 22,
  fontWeight: 800,
  lineHeight: 1,
  cursor: 'pointer',
  color: colors.gray600,
  background: 'none',
  border: 'none',
} as const;

/** The dialog's title row: icon tile, title, × (design's own geometry). */
export function EncabezadoCompartir() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span aria-hidden="true" style={TILE}>
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.black}
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.2-5.4A8.4 8.4 0 1 1 21 11.5Z" />
        </svg>
      </span>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: colors.black }}>
        <Dialog.Title>Compartir por WhatsApp</Dialog.Title>
      </div>
      <Dialog.Close asChild>
        <button type="button" aria-label="Cerrar" style={BOTON_X}>
          ×
        </button>
      </Dialog.Close>
    </div>
  );
}

const CAJA = {
  background: colors.white,
  border: `2px solid ${colors.black}`,
  borderRadius: 14,
  padding: 16,
  fontSize: 16,
  fontWeight: 600,
  color: colors.black,
  lineHeight: 1.45,
  minHeight: 96,
  textWrap: 'pretty',
} as const;

const ETIQUETA = {
  fontSize: portalFontSizes.tag,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: colors.gray600,
  margin: '20px 0 6px',
} as const;

/** The editable message: a fresh copy every time the dialog opens. */
export function CajaMensaje({
  inicial,
  onTexto,
}: {
  readonly inicial: string;
  readonly onTexto: (t: string) => void;
}) {
  const [texto, setTexto] = useState(inicial);
  useEffect(() => setTexto(inicial), [inicial]);
  return (
    <>
      <div style={ETIQUETA}>Mensaje</div>
      <div
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Mensaje"
        tabIndex={0}
        suppressContentEditableWarning
        onInput={(e) => {
          const t = e.currentTarget.textContent ?? '';
          setTexto(t);
          onTexto(t);
        }}
        style={CAJA}
      >
        {texto}
      </div>
    </>
  );
}

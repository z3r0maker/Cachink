'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { colors } from '@xangarro/tokens';

import { Button } from './button';
import { CajaMensaje, EncabezadoCompartir } from './whatsapp-partes';

/**
 * «Compartir por WhatsApp» (P-32): the message is editable, the send is a
 * deep link (`wa.me`, no number — the owner picks the recipient), and the
 * attachment chip names the artifact the design pairs with each variant.
 * Deep link + manual send only: there is no Cloud API, by decision
 * (`11-pre-launch…` §2). Escape and the backdrop close it, as every dialog.
 */
const OVERLAY = {
  position: 'fixed',
  inset: 0,
  zIndex: 97,
  background: 'rgba(13,13,13,0.45)',
  display: 'grid',
  placeItems: 'center',
  padding: 24,
} as const;

const TARJETA = {
  width: 'min(520px,100%)',
  background: colors.white,
  border: `2.5px solid ${colors.black}`,
  borderRadius: 20,
  boxShadow: `6px 6px 0 ${colors.black}`,
  padding: 26,
} as const;

const NOTA = {
  margin: '14px 0 0',
  fontSize: 13,
  fontWeight: 600,
  color: colors.gray600,
  textWrap: 'pretty',
} as const;

export function WhatsAppDialog({
  open,
  onOpenChange,
  mensaje,
  archivo,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mensaje: string;
  readonly archivo: string | null;
}) {
  const [texto, setTexto] = useState(mensaje);
  const [copiado, setCopiado] = useState(false);
  useEffect(() => setCopiado(false), [open]);

  const copiar = async () => {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={OVERLAY}>
          <Cuerpo
            mensaje={mensaje}
            archivo={archivo}
            onTexto={setTexto}
            texto={texto}
            copiar={copiar}
            copiado={copiado}
          />
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The card itself — split for the line budget. */
function Cuerpo(p: {
  readonly mensaje: string;
  readonly archivo: string | null;
  readonly texto: string;
  readonly onTexto: (t: string) => void;
  readonly copiar: () => Promise<void>;
  readonly copiado: boolean;
}) {
  return (
    <Dialog.Content aria-label="Compartir por WhatsApp" style={TARJETA}>
      <EncabezadoCompartir />
      <CajaMensaje inicial={p.mensaje} onTexto={p.onTexto} />
      <ArchivoChip archivo={p.archivo} />
      <Acciones texto={p.texto} copiar={p.copiar} copiado={p.copiado} />
      <Dialog.Description style={NOTA}>
        Se envía desde tu WhatsApp. Tú eliges a quién.
      </Dialog.Description>
    </Dialog.Content>
  );
}

/** The attachment chip the design pairs with each variant. */
const CHIP = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginTop: 12,
  border: `2px solid ${colors.black}`,
  borderRadius: 12,
  background: colors.offwhite,
  padding: '12px 14px',
} as const;

const CHIP_ICONO = {
  width: 32,
  height: 32,
  flex: 'none',
  border: `2px solid ${colors.black}`,
  borderRadius: 9,
  background: colors.white,
  display: 'grid',
  placeItems: 'center',
} as const;

const CHIP_TXT = {
  fontSize: 14,
  fontWeight: 700,
  color: colors.black,
  minWidth: 0,
  overflowWrap: 'anywhere',
} as const;

function ArchivoChip({ archivo }: { readonly archivo: string | null }) {
  if (archivo === null) return null;
  return (
    <div style={CHIP}>
      <span aria-hidden="true" style={CHIP_ICONO}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.black}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3h9l4 4v14H6V3Zm3 9h7M9 16h7" />
        </svg>
      </span>
      <span style={CHIP_TXT}>{archivo}</span>
    </div>
  );
}

/** «Abrir WhatsApp» (deep link, no number) and «Copiar mensaje». */
function Acciones({
  texto,
  copiar,
  copiado,
}: {
  readonly texto: string;
  readonly copiar: () => Promise<void>;
  readonly copiado: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
      <AbrirWhatsApp texto={texto} />
      <Button variant="secondary" onClick={() => void copiar()} data-no-print>
        {copiado ? '¡Copiado!' : 'Copiar mensaje'}
      </Button>
    </div>
  );
}

/** The deep link: no number — the owner picks the recipient in their app. */
const ENLACE = {
  flex: 1,
  minWidth: 180,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  height: 54,
  padding: '0 20px',
  background: colors.black,
  color: colors.white,
  border: `2.5px solid ${colors.black}`,
  borderRadius: 16,
  boxShadow: `4px 4px 0 ${colors.black}`,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
} as const;

function AbrirWhatsApp({ texto }: { readonly texto: string }) {
  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
      target="_blank"
      rel="noreferrer"
      data-no-print
      style={ENLACE}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.2-5.4A8.4 8.4 0 1 1 21 11.5Z" />
      </svg>
      Abrir WhatsApp
    </a>
  );
}

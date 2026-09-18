'use client';

import { useState } from 'react';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as l from '../turno/lists.css';
import { OpModal } from '../ui/modal';
import * as u from '../ui/ui.css';
import * as e from './efectivo.css';
import { digits, downloadReceiptPng, receiptText, whatsappUrl, type Comprobante } from './receipt';
import * as s from './share.css';
import { Preview } from './preview';

const WA =
  'M20.5 3.5A10 10 0 0 0 3.2 15.6L2 22l6.5-1.2A10 10 0 1 0 20.5 3.5M8.5 8.5c.3 1.5 1 2.8 2 3.8s2.3 1.7 3.8 2c.6-.6 1-1.3 1.4-1.2l2 .8c.2 1.3-.6 2.2-1.8 2.3-3 .2-7.7-4.4-7.9-7.5-.1-1.2.8-2 2.1-1.8l.8 2c.1.4-.6.9-1.2 1.4';
const DOWNLOAD = 'M12 3v12M7 11l5 5 5-5M4 21h16';
const COPY = 'M9 9h10v10H9V9Zm-4 6H3V3h12v2';
const CHECK = 'M20 6 9 17l-5-5';

interface Opcion {
  readonly label: string;
  readonly hint: string;
  readonly icon: string;
  readonly bg: string;
  readonly disabled: boolean;
  readonly run: () => string;
}

/** The three ways out; each returns the confirmation the design shows. */
function opciones(c: Comprobante, tel: string): readonly Opcion[] {
  return [
    {
      label: 'Enviar por WhatsApp',
      hint: 'Se abre WhatsApp con el comprobante listo',
      icon: WA,
      bg: colors.greenSoft,
      disabled: digits(tel).length < 10,
      run: () => {
        window.open(whatsappUrl(tel, c), '_blank', 'noopener');
        return `Comprobante enviado al ${tel} por WhatsApp.`;
      },
    },
    {
      label: 'Guardar imagen',
      hint: 'PNG del comprobante en este dispositivo',
      icon: DOWNLOAD,
      bg: colors.white,
      disabled: false,
      run: () => {
        downloadReceiptPng(c);
        return `Imagen guardada como comprobante-${c.folio}.png.`;
      },
    },
    {
      label: 'Copiar texto',
      hint: 'Para pegarlo donde quieras',
      icon: COPY,
      bg: colors.white,
      disabled: false,
      run: () => {
        void navigator.clipboard.writeText(receiptText(c));
        return 'Texto del comprobante copiado.';
      },
    },
  ];
}

/**
 * Compartir comprobante. WhatsApp opens a `wa.me` text receipt (no API, Track N
 * row 13); «Guardar imagen» and «Copiar texto» work on this device.
 */
export function Share({
  comprobante,
  onClose,
}: {
  readonly comprobante: Comprobante | null;
  readonly onClose: () => void;
}) {
  const [tel, setTel] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  if (!comprobante) return null;
  return (
    <OpModal
      open
      onClose={onClose}
      title="Compartir comprobante"
      titleSize={portalFontSizes.lg}
      width={440}
      headBg={colors.yellow}
      bodyGap={16}
    >
      <Preview c={comprobante} />
      <Telefono tel={tel} setTel={setTel} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opciones(comprobante, tel).map((o) => (
          <OpcionButton key={o.label} o={o} onDone={setSent} />
        ))}
      </div>
      {sent ? <Hecho text={sent} /> : null}
    </OpModal>
  );
}

function OpcionButton({
  o,
  onDone,
}: {
  readonly o: Opcion;
  readonly onDone: (text: string) => void;
}) {
  return (
    <button
      type="button"
      className={s.option}
      style={{ background: o.bg }}
      disabled={o.disabled}
      onClick={() => onDone(o.run())}
    >
      <span className={u.tintBox} style={{ width: 40, height: 40, background: colors.white }}>
        <Icon path={o.icon} size={20} strokeWidth={2.3} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span className={l.name} style={{ display: 'block' }}>
          {o.label}
        </span>
        <span
          className={s.lineText}
          style={{
            display: 'block',
            fontSize: portalFontSizes.xs,
            fontWeight: typography.weights.semibold,
            color: colors.ink,
          }}
        >
          {o.hint}
        </span>
      </span>
    </button>
  );
}

function Hecho({ text }: { readonly text: string }) {
  return (
    <div className={s.sent}>
      <span style={{ color: colors.greenText, display: 'grid' }}>
        <Icon path={CHECK} size={20} strokeWidth={2.7} />
      </span>
      <div className={s.lineText} style={{ fontSize: portalFontSizes.md }}>
        {text}
      </div>
    </div>
  );
}

function Telefono({ tel, setTel }: { readonly tel: string; readonly setTel: (t: string) => void }) {
  return (
    <div>
      <label htmlFor="sh-tel" className={e.label}>
        Teléfono del cliente
      </label>
      <input
        id="sh-tel"
        className={s.tel}
        type="tel"
        inputMode="tel"
        placeholder="55 1234 5678"
        value={tel}
        onChange={(ev) => setTel(ev.target.value.replace(/[^0-9 ]/g, ''))}
      />
    </div>
  );
}

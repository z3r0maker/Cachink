'use client';

import { useState } from 'react';
import { colors, portalFontSizes } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as l from '../turno/lists.css';
import { OpModal } from '../ui/modal';
import * as u from '../ui/ui.css';
import * as e from './efectivo.css';
import type { Comprobante } from './receipt';
import * as s from './share.css';
import { opciones, VARIANTS, type Opcion, type ShareVariant, type Variant } from './share-options';
import { Preview } from './preview';

const CHECK = 'M20 6 9 17l-5-5';

/**
 * Compartir comprobante. WhatsApp opens a `wa.me` text receipt (no API, Track N
 * row 13); «Guardar imagen» and «Copiar texto» work on this device.
 */
export function Share({
  comprobante,
  onClose,
  variant = 'caja',
}: {
  readonly comprobante: Comprobante | null;
  readonly onClose: () => void;
  readonly variant?: ShareVariant;
}) {
  const [tel, setTel] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  if (!comprobante) return null;
  const v = VARIANTS[variant];
  return (
    <OpModal
      open
      onClose={onClose}
      title={v.title(comprobante.folio)}
      titleSize={portalFontSizes.lg}
      width={v.width}
      headBg={colors.yellow}
      bodyGap={v.gap}
    >
      {v.preview ? <Preview c={comprobante} /> : null}
      <Telefono tel={tel} setTel={setTel} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opciones(comprobante, tel).map((o) => (
          <OpcionButton key={o.label} o={o} v={v} onDone={setSent} />
        ))}
      </div>
      {sent ? <Hecho text={sent} /> : null}
    </OpModal>
  );
}

function OpcionButton({
  o,
  v,
  onDone,
}: {
  readonly o: Opcion;
  readonly v: Variant;
  readonly onDone: (text: string) => void;
}) {
  return (
    <button
      type="button"
      className={s.option}
      style={{ background: o.bg, minHeight: v.option }}
      disabled={o.disabled}
      onClick={() => onDone(o.run())}
    >
      <span
        className={u.tintBox}
        style={{ width: v.tile, height: v.tile, background: colors.white }}
      >
        <Icon path={o.icon} size={v.icon} strokeWidth={2.3} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span className={l.name} style={{ display: 'block', letterSpacing: v.labelSpacing }}>
          {o.label}
        </span>
        <span className={s.optionHint}>{o.hint}</span>
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

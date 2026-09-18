'use client';

import { useState } from 'react';
import { colors, portalFontSizes } from '@xangarro/tokens';

import { Icon } from '../../../shell/icon';
import { HeaderAction } from '../../shell/shell';
import * as sh from '../../caja/share.css';
import { digits } from '../../caja/receipt';
import * as e from '../../caja/efectivo.css';
import { OpModal } from '../../ui/modal';
import * as u from '../../ui/ui.css';
import * as s from './cliente.css';

const WA = 'M20.5 3.5A10 10 0 0 0 3.2 15.6L2 22l6.5-1.2A10 10 0 1 0 20.5 3.5';
const CHECK = 'M20 6 9 17l-5-5';

/** The header's «Recordarle por WhatsApp». */
export function RecordarBoton({ onClick }: { readonly onClick: () => void }) {
  return (
    <HeaderAction>
      <button type="button" className={s.recordar} onClick={onClick}>
        <Icon path={WA} size={17} strokeWidth={2.3} />
        Recordarle por WhatsApp
      </button>
    </HeaderAction>
  );
}

/**
 * «Recordarle su saldo»: the phone comes prefilled and the message carries the
 * live balance. It opens WhatsApp (`wa.me`, Track N row 13); nothing is sent by us.
 */
export function Recordar(p: {
  readonly telefono: string;
  readonly mensaje: string;
  readonly onClose: () => void;
}) {
  const [tel, setTel] = useState(p.telefono);
  const [sent, setSent] = useState<string | null>(null);
  const listo = digits(tel).length >= 10;
  const enviar = () => {
    window.open(
      `https://wa.me/52${digits(tel)}?text=${encodeURIComponent(p.mensaje)}`,
      '_blank',
      'noopener',
    );
    setSent(`WhatsApp abierto con el recordatorio para el ${tel}.`); // D2 (ADR-083)
  };
  return (
    <OpModal
      open
      onClose={p.onClose}
      title="Recordarle su saldo"
      titleSize={portalFontSizes.lg}
      width={460}
      headBg={colors.greenSoft}
    >
      <Telefono tel={tel} setTel={setTel} />
      <div className={s.mensaje}>
        <div className={u.eyebrow}>Mensaje que se envía</div>
        <div className={s.mensajeTexto}>{p.mensaje}</div>
      </div>
      <button type="button" className={s.enviar} disabled={!listo} onClick={enviar}>
        Enviar por WhatsApp
      </button>
      {sent ? <Enviado text={sent} /> : null}
    </OpModal>
  );
}

function Telefono(p: { readonly tel: string; readonly setTel: (t: string) => void }) {
  return (
    <div>
      <label htmlFor="rc-tel" className={e.label}>
        Teléfono
      </label>
      <input
        id="rc-tel"
        className={sh.tel}
        type="tel"
        inputMode="tel"
        value={p.tel}
        onChange={(ev) => p.setTel(ev.target.value.replace(/[^0-9 ]/g, ''))}
      />
    </div>
  );
}

function Enviado({ text }: { readonly text: string }) {
  return (
    <div className={sh.sent}>
      <span style={{ color: colors.greenText, display: 'grid' }}>
        <Icon path={CHECK} size={20} strokeWidth={2.7} />
      </span>
      <div className={s.mensajeTexto} style={{ marginTop: 0 }}>
        {text}
      </div>
    </div>
  );
}

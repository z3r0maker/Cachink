'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';

import { Icon } from '../../../shell/icon';
import { HeaderAction } from '../../shell/shell';
import { digits } from '../../caja/receipt';
import * as l from '../../ui/lateral.css';
import * as u from '../../ui/resumen.css';
import * as pie from './recordar-pie.css';
import * as r from './recordar.css';
import * as s from './cliente.css';

const WA = 'M20.5 3.5A10 10 0 0 0 3.2 15.6L2 22l6.5-1.2A10 10 0 1 0 20.5 3.5';
const CHECK = 'M20 6 9 17l-5-5';
const CLOSE = 'M18 6 6 18M6 6l12 12';
const COPY = 'M8 8h12v12H8zM4 16V4h12';
const LEIDO = 'M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16';
const EXTERNO = 'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6';

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
 * «Recordarle su saldo a …»: the phone comes prefilled and the message carries
 * the live balance; both can be changed. It opens WhatsApp (`wa.me`, Track N
 * row 13) with the text ready; nothing is sent by the caja.
 */
export function Recordar(p: {
  readonly nombre: string;
  readonly telefono: string;
  readonly mensaje: string;
  readonly onClose: () => void;
}) {
  const [tel, setTel] = useState(p.telefono);
  const [msg, setMsg] = useState(p.mensaje);
  return (
    <Dialog.Root open onOpenChange={(o) => (o ? undefined : p.onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className={r.overlay}>
          <Dialog.Content className={r.card} aria-describedby="rs-nota">
            <Cabeza nombre={p.nombre} />
            <Telefono tel={tel} setTel={setTel} />
            <Mensaje msg={msg} setMsg={setMsg} original={p.mensaje} />
            <Acciones tel={tel} msg={msg} />
            <span id="rs-nota" className={pie.nota}>
              Se abre WhatsApp con el mensaje listo. Tú decides si lo mandas.
            </span>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Cabeza({ nombre }: { readonly nombre: string }) {
  return (
    <div className={r.head}>
      <span className={r.icono}>
        <Icon path={WA} size={24} strokeWidth={2.2} />
      </span>
      <div className={r.titulos}>
        <span className={u.eyebrow}>Recordatorio por WhatsApp</span>
        <Dialog.Title className={r.titulo}>Recordarle su saldo a {nombre}</Dialog.Title>
      </div>
      <Dialog.Close className={l.close} aria-label="Cerrar">
        <Icon path={CLOSE} size={20} strokeWidth={2.4} />
      </Dialog.Close>
    </div>
  );
}

function Telefono(p: { readonly tel: string; readonly setTel: (t: string) => void }) {
  return (
    <div className={r.campo}>
      <label htmlFor="rs-tel" className={r.label}>
        Su número
      </label>
      <span className={r.tel}>
        <span className={r.lada}>+52</span>
        <input
          id="rs-tel"
          className={r.telInput}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={p.tel}
          onChange={(ev) => p.setTel(ev.target.value.replace(/[^0-9 ]/g, ''))}
        />
      </span>
      {digits(p.tel).length === 10 ? null : (
        <span role="status" className={r.error}>
          Faltan números: son 10 dígitos.
        </span>
      )}
    </div>
  );
}

function Mensaje(p: {
  readonly msg: string;
  readonly setMsg: (m: string) => void;
  readonly original: string;
}) {
  return (
    <div className={r.campo}>
      <span className={r.mensajeHead}>
        <label htmlFor="rs-msg" className={r.label}>
          Mensaje
        </label>
        <span className={r.hint}>Así le llega. Puedes cambiarlo.</span>
      </span>
      <div className={r.chat}>
        <div className={r.burbuja}>
          <textarea
            id="rs-msg"
            rows={5}
            className={r.textarea}
            value={p.msg}
            onChange={(ev) => p.setMsg(ev.target.value)}
          />
          <span className={r.hora} aria-hidden="true">
            {ahora()}
            <Icon path={LEIDO} size={15} strokeWidth={2.4} />
          </span>
        </div>
      </div>
      {p.msg === p.original ? null : (
        <button type="button" className={r.restaurar} onClick={() => p.setMsg(p.original)}>
          Volver al mensaje original
        </button>
      )}
    </div>
  );
}

function Acciones({ tel, msg }: { readonly tel: string; readonly msg: string }) {
  const [copiado, setCopiado] = useState(false);
  const ok = digits(tel).length === 10;
  const copiar = () => {
    void navigator.clipboard?.writeText(msg).then(
      () => setCopiado(true),
      () => undefined,
    );
  };
  return (
    <div className={pie.acciones}>
      <button type="button" className={pie.copiar} onClick={copiar}>
        <Icon path={copiado ? CHECK : COPY} size={18} strokeWidth={2.2} />
        <span aria-live="polite">{copiado ? 'Copiado' : 'Copiar mensaje'}</span>
      </button>
      <a
        className={pie.abrir}
        href={ok ? `https://wa.me/52${digits(tel)}?text=${encodeURIComponent(msg)}` : undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={ok ? undefined : true}
      >
        Abrir WhatsApp
        <Icon path={EXTERNO} size={18} strokeWidth={2.4} />
      </a>
    </div>
  );
}

/** The bubble's hour: now, as the client would see it arrive. */
function ahora(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

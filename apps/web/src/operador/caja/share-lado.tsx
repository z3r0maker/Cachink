'use client';

import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as m from '../ui/mostrador.css';
import { digits, type Comprobante } from './receipt';
import * as s from './share-dialogo.css';
import { opciones, telValido, type Opcion } from './share-options';

const CHECK = 'M20 6 9 17l-5-5';
const TEL =
  'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384';

/** The right side: the optional number, the three ways out, and what just happened. */
export function Lado(p: {
  readonly c: Comprobante;
  readonly cliente?: string;
  readonly tel: string;
  readonly setTel: (t: string) => void;
  readonly hecho: string | null;
  readonly onHecho: (t: string) => void;
}) {
  return (
    <div className={s.lado}>
      <Telefono tel={p.tel} setTel={p.setTel} />
      {opciones(p.c, p.tel, p.cliente).map((o) => (
        <OpcionBoton key={o.label} o={o} onDone={p.onHecho} />
      ))}
      {p.hecho ? (
        <div role="status" className={s.hecho}>
          <span style={{ color: colors.greenText, display: 'grid' }}>
            <Icon path={CHECK} size={20} strokeWidth={2.7} />
          </span>
          {p.hecho}
        </div>
      ) : null}
    </div>
  );
}

function Telefono({ tel, setTel }: { readonly tel: string; readonly setTel: (t: string) => void }) {
  const mal = !telValido(tel);
  return (
    <div className={s.grupo}>
      <label htmlFor="sh-tel" className={m.etiqueta}>
        Número del cliente <span className={m.opcional}>(opcional)</span>
      </label>
      <span className={`${m.campo} ${s.campoTel}`}>
        <span style={{ color: colors.gray600, display: 'grid' }}>
          <Icon path={TEL} size={18} strokeWidth={2} />
        </span>
        <input
          id="sh-tel"
          className={`${m.campoInput} ${s.tel}`}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="55 1234 5678"
          value={tel}
          aria-describedby="sh-tel-ayuda"
          onChange={(ev) => setTel(ev.target.value.replace(/[^0-9 ]/g, ''))}
        />
      </span>
      <span id="sh-tel-ayuda" className={s.ayuda} data-mal={mal ? '' : undefined}>
        {mal
          ? `Van ${digits(tel).length} de 10 números.`
          : 'Si lo dejas vacío, escoges el contacto en WhatsApp.'}
      </span>
    </div>
  );
}

function OpcionBoton({ o, onDone }: { readonly o: Opcion; readonly onDone: (t: string) => void }) {
  return (
    <button
      type="button"
      className={s.opcion}
      data-principal={o.principal ? '' : undefined}
      disabled={o.disabled}
      onClick={() => void Promise.resolve(o.run()).then(onDone)}
    >
      <span className={s.opcionTile} style={{ background: o.tile }}>
        <Icon path={o.icon} size={22} strokeWidth={2.2} />
      </span>
      <span className={s.opcionTextos}>
        <span className={s.opcionLabel}>{o.label}</span>
        <span className={s.opcionHint}>{o.hint}</span>
      </span>
    </button>
  );
}

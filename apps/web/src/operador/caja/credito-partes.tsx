'use client';

import { formatMoney, type Money } from '@xangarro/domain';

import { Icon } from '../../shell/icon';
import * as m from '../ui/mostrador.css';
import * as k from './credito.css';
import type { ClienteFiado } from './types';

const PLUS = 'M12 5v14M5 12h14';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Clients whose name has the typed text, accents aside. */
export function filtrar(clientes: readonly ClienteFiado[], q: string): readonly ClienteFiado[] {
  const t = norm(q.trim());
  return t === '' ? clientes : clientes.filter((x) => norm(x.nombre).includes(t));
}

/** One client: what they owe now and, once chosen, what they would owe. */
export function ClienteRadio(p: {
  readonly k: ClienteFiado;
  readonly total: Money;
  readonly on: boolean;
  readonly onPick: () => void;
}) {
  const debe = p.k.saldo > 0n;
  return (
    <button type="button" role="radio" aria-checked={p.on} className={k.cliente} onClick={p.onPick}>
      <span className={k.punto} aria-hidden="true" />
      <span className={k.texto}>
        <span className={k.nombre}>{p.k.nombre}</span>
        <span className={k.debe} data-cero={debe ? undefined : ''}>
          {debe ? `Debe ${formatMoney(p.k.saldo)}` : 'Sin saldo'}
        </span>
        {p.on ? (
          <span className={k.quedaria}>Quedaría debiendo {formatMoney(p.k.saldo + p.total)}</span>
        ) : null}
      </span>
    </button>
  );
}

/** «Cliente nuevo»: opens a name field; null while closed. */
export function ClienteNuevo(p: {
  readonly nombre: string | null;
  readonly onNombre: (n: string | null) => void;
}) {
  const abierto = p.nombre !== null;
  return (
    <div className={k.nuevo} data-abierto={abierto ? '' : undefined}>
      <button
        type="button"
        className={k.nuevoBoton}
        aria-expanded={abierto}
        onClick={() => p.onNombre(abierto ? null : '')}
      >
        <span className={k.mas}>
          <Icon path={PLUS} size={16} strokeWidth={2.6} />
        </span>
        Cliente nuevo
      </button>
      {abierto ? (
        <div className={k.nuevoCampos}>
          <label className={k.campo}>
            <span className={m.etiqueta}>Nombre</span>
            <span className={m.campo}>
              <input
                className={m.campoInput}
                value={p.nombre ?? ''}
                placeholder="Don Beto del puesto"
                onChange={(ev) => p.onNombre(ev.target.value)}
              />
            </span>
          </label>
          <span className={k.nota}>El dueño lo revisa en su portal.</span>
        </div>
      ) : null}
    </div>
  );
}

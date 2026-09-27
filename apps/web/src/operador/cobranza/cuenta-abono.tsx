'use client';

import { useState } from 'react';
import { formatMoney, toPesosString, type Money } from '@xangarro/domain';

import { parseRecibido } from '@xangarro/caja/caja';
import {
  vistaAbono,
  estadoCuenta,
  type CuentaCliente,
  rapidos,
  METODOS_ABONO,
  type MetodoAbono,
} from '@xangarro/caja/cobranza';
import * as a from './cuenta-abono.css';

/** The amount being typed, how it is paid, and where it would land (oldest first). */
export function useAbonoCuenta(c: CuentaCliente) {
  const [raw, setRaw] = useState('');
  const [metodo, setMetodo] = useState<MetodoAbono>('Efectivo');
  const parsed = parseRecibido(raw);
  const monto = parsed !== null && parsed > 0n ? parsed : null;
  const e = estadoCuenta(c);
  const vista = monto === null ? null : vistaAbono(c, e, monto, true);
  return { raw, setRaw, metodo, setMetodo, monto, vista, saldo: e.saldo };
}

export type AbonoCuenta = ReturnType<typeof useAbonoCuenta>;

/** «Recibir abono»: the yellow box of the account panel. */
export function AbonoCaja({ x, foco }: { readonly x: AbonoCuenta; readonly foco: boolean }) {
  return (
    <section aria-labelledby="ab-t" className={a.caja}>
      <h3 id="ab-t" className={a.titulo}>
        Recibir abono
      </h3>
      <div className={a.campo}>
        <label htmlFor="ab-monto" className={a.label}>
          Cuánto abona
        </label>
        <span className={a.monto}>
          <span className={a.signo} aria-hidden="true">
            $
          </span>
          <input
            id="ab-monto"
            className={a.input}
            inputMode="decimal"
            autoComplete="off"
            autoFocus={foco}
            value={x.raw}
            onChange={(ev) => x.setRaw(ev.target.value.replace(/[^0-9.]/g, ''))}
          />
        </span>
        <Rapidos x={x} />
      </div>
      <Metodos value={x.metodo} onChange={x.setMetodo} />
      <SeAplica x={x} />
    </section>
  );
}

function Rapidos({ x }: { readonly x: AbonoCuenta }) {
  return (
    <div className={a.rapidos}>
      {rapidos(x.saldo).map((m) => (
        <button
          key={String(m)}
          type="button"
          className={a.rapido}
          aria-pressed={x.monto === m}
          onClick={() => x.setRaw(toPesosString(m).replace(/\.00$/, ''))}
        >
          {m === x.saldo ? `Todo · ${formatMoney(m)}` : formatMoney(m)}
        </button>
      ))}
    </div>
  );
}

function Metodos(p: { readonly value: MetodoAbono; readonly onChange: (m: MetodoAbono) => void }) {
  return (
    <div role="radiogroup" aria-labelledby="ab-m" className={a.metodos}>
      <span id="ab-m" className={a.metodosLabel}>
        Cómo paga
      </span>
      {METODOS_ABONO.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={p.value === m}
          className={a.metodo}
          onClick={() => p.onChange(m)}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function SeAplica({ x }: { readonly x: AbonoCuenta }) {
  return (
    <div className={a.aplica}>
      <span className={a.aplicaTexto}>
        <span className={a.aplicaFuerte}>Se aplica a:</span> {x.vista?.texto ?? 'Elige un monto'}
      </span>
      <span className={a.restanteRow}>
        Saldo restante
        <span className={a.restante}>{formatMoney(x.vista?.restante ?? x.saldo)}</span>
      </span>
    </div>
  );
}

/** The panel's main action: «Recibir abono de $500.00», or what is missing. */
export function RecibirBoton(p: {
  readonly x: AbonoCuenta;
  readonly onSave: (metodo: MetodoAbono, monto: Money) => void;
}) {
  const { monto, metodo } = p.x;
  return (
    <button
      type="button"
      className={a.recibir}
      disabled={monto === null}
      onClick={() => monto !== null && p.onSave(metodo, monto)}
    >
      {monto === null ? 'Escribe cuánto abona' : `Recibir abono de ${formatMoney(monto)}`}
    </button>
  );
}

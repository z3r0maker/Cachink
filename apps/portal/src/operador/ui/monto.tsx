import type { ReactNode } from 'react';

import * as f from './field.css';
import * as m from './monto.css';

/** Digits and one decimal point only; the caller parses to centavos. */
const clean = (raw: string) => raw.replace(/[^0-9.]/g, '');

/** «$ 0.00»: label, the boxed amount, and an optional trailing control (Cobrar's «Borrar»). */
export function MontoInput(p: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (raw: string) => void;
  readonly size: 'caja' | 'gasto';
  readonly trailing?: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={p.id} className={f.label}>
        {p.label}
      </label>
      <div className={`${m.box} ${m.boxSize[p.size]}`}>
        <span className={m.peso}>$</span>
        <input
          id={p.id}
          className={m.field[p.size]}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={p.value}
          onChange={(ev) => p.onChange(clean(ev.target.value))}
        />
        {p.trailing}
      </div>
    </div>
  );
}

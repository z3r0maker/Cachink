import { Icon } from '../../shell/icon';
import { Glyph } from '../ui/parts';
import { PRODUCT_ICONS } from '@xangarro/caja';
import {
  conUnidad,
  MOTIVOS_MERMA,
  type Existencia,
  type MotivoMerma,
  type TipoMovimiento,
} from '@xangarro/caja/inventario';
import { EstadoChip } from './listas';
import * as s from './mover.css';

const MENOS = 'M5 12h14';
const MAS = 'M12 5v14M5 12h14';
const TIPOS: readonly (readonly [TipoMovimiento, string])[] = [
  ['Entrada', 'Llegó mercancía'],
  ['Merma', 'Se echó a perder o se dañó (merma)'],
];

/** «Llegó mercancía» / «Se echó a perder o se dañó (merma)». */
export function Tipos(p: {
  readonly value: TipoMovimiento;
  readonly onChange: (t: TipoMovimiento) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Tipo de movimiento" className={s.tipos}>
      {TIPOS.map(([k, label]) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={p.value === k}
          className={s.tipo}
          onClick={() => p.onChange(k)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** The product being moved, its stock and its state. */
export function Articulo({ it }: { readonly it: Existencia }) {
  return (
    <div className={s.item}>
      <span className={s.itemTile} style={{ background: it.tint }}>
        <Glyph paths={PRODUCT_ICONS[it.icono]} size={26} stroke={2.2} />
      </span>
      <span className={s.itemCol}>
        <span className={s.itemName}>{it.nombre}</span>
        <span className={s.itemSub}>
          Hay {conUnidad(it.existencias, it.unidad)} · aviso en {conUnidad(it.umbral, it.unidad)}
        </span>
      </span>
      <EstadoChip it={it} />
    </div>
  );
}

/** How much: − and + around a field the operator can also type in. */
export function Cantidad(p: {
  readonly label: string;
  readonly raw: string;
  readonly unidad: string;
  readonly quedan: string;
  /** Whole units only: the stepper rounds, and the keypad is numeric. */
  readonly enteros?: boolean;
  readonly onChange: (raw: string) => void;
}) {
  const n = Number.parseFloat(p.raw) || 0;
  const redondeo = (v: number) => (p.enteros ? Math.round(v) : Math.round(v * 100) / 100);
  const set = (v: number) => p.onChange(String(Math.max(1, redondeo(v))));
  return (
    <div className={s.campo}>
      <label htmlFor="mov-cant" className={s.label}>
        {p.label}
      </label>
      <div className={s.stepper}>
        <button type="button" className={s.paso} aria-label="Uno menos" onClick={() => set(n - 1)}>
          <Icon path={MENOS} size={22} strokeWidth={2.6} />
        </button>
        <span className={s.cantidadBox}>
          <input
            id="mov-cant"
            type="text"
            inputMode={p.enteros ? 'numeric' : 'decimal'}
            className={s.cantidadInput}
            value={p.raw}
            onChange={(e) => p.onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          />
          <span className={s.unidad}>{p.unidad}</span>
        </span>
        <button type="button" className={s.pasoMas} aria-label="Uno más" onClick={() => set(n + 1)}>
          <Icon path={MAS} size={22} strokeWidth={2.6} />
        </button>
      </div>
      <span className={s.quedan}>{p.quedan}</span>
    </div>
  );
}

/** A write-off always says what happened. */
export function Motivos(p: {
  readonly value: MotivoMerma | null;
  readonly onChange: (m: MotivoMerma) => void;
}) {
  return (
    <div role="radiogroup" aria-labelledby="mot-l" className={s.campo}>
      <span id="mot-l" className={s.label}>
        ¿Qué le pasó?
      </span>
      <div className={s.motivos}>
        {MOTIVOS_MERMA.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={p.value === m}
            className={s.motivo}
            onClick={() => p.onChange(m)}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

/** A free text field with «(si quieres)». */
export function Opcional(p: {
  readonly id: string;
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
}) {
  return (
    <div className={s.campo}>
      <label htmlFor={p.id} className={s.label}>
        {p.label} <span className={s.opcional}>(si quieres)</span>
      </label>
      <input
        id={p.id}
        type="text"
        className={s.texto}
        placeholder={p.placeholder}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
      />
    </div>
  );
}

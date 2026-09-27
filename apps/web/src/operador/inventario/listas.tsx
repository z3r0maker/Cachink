import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { Glyph } from '../ui/parts';
import { PRODUCT_ICONS } from '../ui/product-icons';
import * as r from '../ui/resumen.css';
import { conUnidad, delta, nivel, porReponer } from './derive';
import * as s from './listas.css';
import type { Existencia, Movimiento, TipoMovimiento } from './types';

const PLUS = 'M12 5v14M5 12h14';

function Tile({ it }: { readonly it: Existencia }) {
  return (
    <span className={s.tile} style={{ background: it.tint }}>
      <Glyph paths={PRODUCT_ICONS[it.icono]} size={22} stroke={2.2} />
    </span>
  );
}

/** «Reponer» at or under the threshold, «Suficiente» above it. */
export function EstadoChip({ it }: { readonly it: Existencia }) {
  const bajo = porReponer(it);
  return <span className={r.chip[bajo ? 'red' : 'green']}>{bajo ? 'Reponer' : 'Suficiente'}</span>;
}

/** Existencias: the threshold, a bar with the threshold at half, the count, and the two moves. */
export function ListaExistencias(p: {
  readonly items: readonly Existencia[];
  readonly query: string;
  readonly sel: string | null;
  readonly onMover: (tipo: TipoMovimiento, id: string) => void;
}) {
  return (
    <section aria-label="Existencias" className={s.card}>
      {p.items.map((it) => (
        <FilaExistencia key={it.id} it={it} sel={p.sel === it.id} onMover={p.onMover} />
      ))}
      {p.items.length === 0 ? (
        <div className={s.nada}>Ningún producto coincide con «{p.query}».</div>
      ) : null}
    </section>
  );
}

function FilaExistencia(p: {
  readonly it: Existencia;
  readonly sel: boolean;
  readonly onMover: (tipo: TipoMovimiento, id: string) => void;
}) {
  const it = p.it;
  return (
    <div className={s.fila} data-sel={p.sel ? '' : undefined}>
      <Tile it={it} />
      <span className={s.nombre}>
        <span className={s.name}>{it.nombre}</span>
        <span className={s.detalle}>Aviso en {conUnidad(it.umbral, it.unidad)}</span>
      </span>
      <Barra it={it} />
      <span className={s.cant}>{conUnidad(it.existencias, it.unidad)}</span>
      <span className={s.chip}>
        <EstadoChip it={it} />
      </span>
      <Acciones it={it} onMover={p.onMover} />
    </div>
  );
}

function Acciones({
  it,
  onMover,
}: {
  readonly it: Existencia;
  readonly onMover: (tipo: TipoMovimiento, id: string) => void;
}) {
  return (
    <span className={s.acciones}>
      <button
        type="button"
        className={s.llego}
        aria-label={`Llegó mercancía de ${it.nombre}`}
        onClick={() => onMover('Entrada', it.id)}
      >
        <span className={s.llegoIcon}>
          <Icon path={PLUS} size={16} strokeWidth={2.4} />
        </span>
        Llegó
      </button>
      <button
        type="button"
        className={s.merma}
        aria-label={`Se echó a perder o se dañó ${it.nombre}`}
        onClick={() => onMover('Merma', it.id)}
      >
        Se echó a perder
      </button>
    </span>
  );
}

function Barra({ it }: { readonly it: Existencia }) {
  const fill = porReponer(it) ? colors.redText : colors.green;
  return (
    <span className={s.barra} aria-hidden="true">
      <span className={s.barraFill} style={{ width: `${nivel(it)}%`, background: fill }} />
      <span className={s.barraAviso} />
    </span>
  );
}

/** «Movimientos de mi turno»: the newest first; entries in green, write-offs in red. */
export function ListaMovimientos(p: {
  readonly movs: readonly Movimiento[];
  readonly items: readonly Existencia[];
}) {
  return (
    <section aria-label="Movimientos de mi turno" className={s.card}>
      <div className={s.movHead} aria-hidden="true">
        <span>HORA</span>
        <span />
        <span>PRODUCTO</span>
        <span>QUÉ PASÓ</span>
        <span style={{ textAlign: 'right' }}>CUÁNTO</span>
      </div>
      {[...p.movs].reverse().map((m) => (
        <FilaMovimiento key={m.id} m={m} it={p.items.find((i) => i.id === m.existenciaId)} />
      ))}
    </section>
  );
}

function FilaMovimiento({
  m,
  it,
}: {
  readonly m: Movimiento;
  readonly it: Existencia | undefined;
}) {
  const entrada = m.tipo === 'Entrada';
  return (
    <div className={s.mov}>
      <span className={s.hora}>{m.hora}</span>
      {it ? <Tile it={it} /> : <span className={s.tile} />}
      <span className={s.nombre}>
        <span className={s.name}>{it?.nombre}</span>
        <span className={s.movDetalle}>{m.detalle}</span>
      </span>
      <span className={s.chip}>
        <span className={r.chip[entrada ? 'green' : 'red']}>
          {entrada ? 'Llegó mercancía' : 'Merma'}
        </span>
      </span>
      <span className={s.movCant} style={{ color: entrada ? colors.greenText : colors.redText }}>
        {delta(m, it?.unidad ?? '')}
      </span>
    </div>
  );
}

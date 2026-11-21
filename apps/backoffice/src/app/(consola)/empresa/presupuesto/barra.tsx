import type { Linea } from '@/server/empresa/presupuesto-tablero';
import * as g from '@/styles/mostrador-graficas.css';
import * as mv from '@/styles/mostrador-movimiento.css';
import * as p from '@/styles/mostrador-presupuesto.css';

import { ROL } from '../servicios/barras';

/**
 * One category's bar (board CD-15d): the projection, what was spent in the
 * category's colour and the budget's mark, on a 0–100 scale. With ADR-161's
 * «Llena» the spending fills from the left; a category over its budget fills
 * to the mark, then its excess fills after it, in red.
 */
export function Barra({ l }: { readonly l: Linea }) {
  const pasa = l.real > l.presupuesto;
  const hasta = pasa ? l.presupuesto : l.real;
  return (
    <svg className={p.pista} viewBox="0 0 100 22" preserveAspectRatio="none" aria-hidden="true">
      <rect className={p.barra.proyeccion} x={0} y={4} width={l.proyeccion} height={14} />
      <rect
        className={`${g.rol[ROL[l.categoria]]} ${mv.llena}`}
        x={0}
        y={4}
        width={hasta}
        height={14}
      />
      {pasa ? (
        <rect
          className={`${g.rol.perdida} ${mv.llenaDespues}`}
          x={l.presupuesto}
          y={4}
          width={l.real - l.presupuesto}
          height={14}
          data-testid="presupuesto-exceso"
        />
      ) : null}
      <rect
        className={p.barra.marca}
        x={Math.min(l.presupuesto, 99.4)}
        y={0}
        width={0.6}
        height={22}
      />
    </svg>
  );
}

import type { ReactNode } from 'react';
import { formatMoney } from '@xangarro/domain';

import { Don } from '@/components/don/don';

import { Icon } from '../../shell/icon';
import * as f from './fondo.css';

const CERRAR = 'M18 6 6 18M6 6l12 12';

/** Another turno right after a close: the cash just counted (P-43, ADR-147). */
export interface Otro {
  readonly contado: bigint;
}

/** The head's words: the first turno greets; another one starts from the last count (P-43). */
function palabras(operador: string, otro: Otro | undefined) {
  const primero = operador.trim().split(/\s+/)[0] ?? '';
  if (otro === undefined) {
    return {
      titulo: `¡Hola, ${primero}! ¿Con cuánto empiezas?`,
      sub: 'Cuenta el fondo que dejaste en la caja para dar cambio.',
    };
  }
  return {
    titulo: primero === '' ? '¿Con cuánto sigues?' : `¿Con cuánto sigues, ${primero}?`,
    sub: `Terminaste con ${formatMoney(otro.contado)}. Si ya entregaste efectivo, cambia la cantidad.`,
  };
}

export function Cabeza(p: {
  readonly operador: string;
  readonly otro: Otro | undefined;
  readonly onCancelar: () => void;
}): ReactNode {
  const w = palabras(p.operador, p.otro);
  return (
    <>
      <button type="button" className={f.cerrar} aria-label="Cerrar" onClick={p.onCancelar}>
        <Icon path={CERRAR} size={20} />
      </button>
      <span className={f.don}>
        <Don pose="hola" size={140} />
      </span>
      <div className={f.titulos}>
        {p.otro === undefined ? null : <span className={f.eyebrow}>Otro turno</span>}
        <h2 id="fondo-titulo" className={f.titulo}>
          {w.titulo}
        </h2>
        <p id="fondo-sub" className={f.sub}>
          {w.sub}
        </p>
      </div>
    </>
  );
}

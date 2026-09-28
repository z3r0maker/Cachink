'use client';

import type { Rango } from '@xangarro/domain';

import { srOnly } from '@/styles/global.css';

import * as s from './carga.css';
import { limitesDeFecha } from './caption';

/**
 * Ventas y gastos between two answers from the server (DS-01): the words a
 * screen reader hears, the row that says a request failed, «Ir a fecha», and
 * the captions that say what the numbers refer to.
 */
const svg = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function Calendario() {
  return (
    <svg {...svg} width={14} height={14} strokeWidth={2.2}>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

/** Not `role="status"`: the pager's counter is the page's status, and specs read it by role. */
export function Cargando({ pendiente }: { readonly pendiente: boolean }) {
  return (
    <span className={srOnly} aria-live="polite">
      {pendiente ? 'Cargando movimientos…' : ''}
    </span>
  );
}

export function FilaError({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div role="alert" className={s.filaError}>
      <svg {...svg} width={18} height={18} strokeWidth={2.4}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <span className={s.filaErrorTexto}>No pudimos cargar los movimientos.</span>
      <button type="button" className={s.reintentar} onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}

export function PeriodoCaption({ texto }: { readonly texto: string }) {
  return (
    <p className={s.caption} data-testid="periodo-caption">
      <Calendario />
      <span>{texto}</span>
    </p>
  );
}

export const PISTA_ID = 'movimientos-pista';

export function PistaPersonalizado() {
  return (
    <p id={PISTA_ID} className={s.pista}>
      <svg {...svg} width={14} height={14} strokeWidth={2.4}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      Elige un periodo para buscar más rápido
    </p>
  );
}

/** A day of the period; the server answers with the page that holds it. */
export function IrAFecha({
  rango,
  onIr,
}: {
  readonly rango: Rango;
  readonly onIr: (dia: string) => void;
}) {
  const { min, max } = limitesDeFecha(rango);
  return (
    <span className={s.irAFecha}>
      <label htmlFor="ir-fecha" className={s.irAFechaLabel}>
        Ir a fecha
      </label>
      <input
        id="ir-fecha"
        type="date"
        className={s.irAFechaCampo}
        min={min}
        max={max}
        onChange={(e) => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) onIr(e.target.value);
        }}
        data-testid="ir-a-fecha"
      />
    </span>
  );
}

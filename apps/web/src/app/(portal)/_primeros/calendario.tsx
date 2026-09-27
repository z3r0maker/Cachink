'use client';

import { MESES } from './formato';
import * as s from './fecha.css';

/** A month grid (Monday first). Days are `YYYY-MM-DD`; `mes` is 0-based. */
export interface Vista {
  readonly y: number;
  readonly m: number;
}

const dos = (n: number) => String(n).padStart(2, '0');
export const isoDe = (y: number, m: number, d: number) => `${y}-${dos(m + 1)}-${dos(d)}`;

export function vistaDe(iso: string): Vista {
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  return m === null ? { y: 2026, m: 0 } : { y: Number(m[1]), m: Number(m[2]) - 1 };
}

export function moverVista(v: Vista, delta: number): Vista {
  const t = new Date(v.y, v.m + delta, 1);
  return { y: t.getFullYear(), m: t.getMonth() };
}

function Flecha({ atras, onClick }: { readonly atras: boolean; readonly onClick: () => void }) {
  return (
    <button
      type="button"
      className={s.flecha}
      aria-label={atras ? 'Mes anterior' : 'Mes siguiente'}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" aria-hidden="true">
        <path
          d={atras ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'}
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function Calendario({
  vista,
  valor,
  hoy,
  onVista,
  onElegir,
}: {
  readonly vista: Vista;
  readonly valor: string;
  readonly hoy: string;
  readonly onVista: (v: Vista) => void;
  readonly onElegir: (iso: string) => void;
}) {
  const mes = MESES[vista.m] ?? '';
  return (
    <>
      <div className={s.mesFila}>
        <Flecha atras onClick={() => onVista(moverVista(vista, -1))} />
        <span className={s.mesTitulo} aria-live="polite">
          {mes.charAt(0).toUpperCase() + mes.slice(1)} {vista.y}
        </span>
        <Flecha atras={false} onClick={() => onVista(moverVista(vista, 1))} />
      </div>
      <div className={s.semana} aria-hidden="true">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <Dias vista={vista} valor={valor} hoy={hoy} onElegir={onElegir} />
    </>
  );
}

function Dias({
  vista,
  valor,
  hoy,
  onElegir,
}: {
  readonly vista: Vista;
  readonly valor: string;
  readonly hoy: string;
  readonly onElegir: (iso: string) => void;
}) {
  const hueco = (new Date(vista.y, vista.m, 1).getDay() + 6) % 7;
  const total = new Date(vista.y, vista.m + 1, 0).getDate();
  const mes = MESES[vista.m] ?? '';
  return (
    <div className={s.dias}>
      {Array.from({ length: hueco }, (_, i) => (
        <span key={`h${i}`} aria-hidden="true" />
      ))}
      {Array.from({ length: total }, (_, i) => {
        const iso = isoDe(vista.y, vista.m, i + 1);
        return (
          <button
            key={iso}
            type="button"
            className={s.dia}
            aria-pressed={iso === valor}
            aria-label={`${i + 1} de ${mes} de ${vista.y}`}
            data-hoy={iso === hoy ? '' : undefined}
            data-dia={iso}
            onClick={() => onElegir(iso)}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { formatMoneyEntero, type Money } from '@xangarro/domain';

import type { WaterfallStep } from './charts-data';
import * as s from './cascada.css';
import { DICHO } from './lado-data';

/**
 * «De lo que vendiste a lo que te quedó» — the Resultados cascade, laid on its
 * side (ADR-107). One row per step: the step in the owner's words and its
 * share of sales, the bar on a shared value axis, and the amount. Results are
 * solid — green when positive, red when not — and what was taken off is a
 * tinted drop hanging from the level above. Merma opens its own list.
 *
 * A table, not an image: the merma row is a button, and a reader walks the
 * rows the way the eye does.
 */
function escala(steps: readonly WaterfallStep[]) {
  const vistos = steps.flatMap((st) => [Number(st.desde), Number(st.hasta)]).concat(0);
  const bajo = Math.min(...vistos);
  const rango = Math.max(...vistos) - bajo || 1;
  return (v: Money | number) => ((Number(v) - bajo) / rango) * 100;
}

function share(st: WaterfallStep, i: number, ventas: Money): string {
  if (i === 0) return 'la base: 100%';
  const valor = st.kind === 'resta' ? st.monto : st.acumulado;
  const p = ventas === 0n ? 0 : Math.round((Math.abs(Number(valor)) / Number(ventas)) * 100);
  const signo = st.kind === 'resta' || valor < 0n ? '−' : '';
  return p === 0 ? 'menos de 1% de lo que vendiste' : `${signo}${p}% de lo que vendiste`;
}

function tono(st: WaterfallStep): keyof typeof s.barra {
  if (st.kind === 'resta') return 'resta';
  return st.acumulado < 0n ? 'perdida' : 'ganancia';
}

function Etiqueta(p: { readonly st: WaterfallStep; readonly abrirMerma?: () => void }) {
  const d = DICHO[p.st.label] ?? { label: p.st.label };
  if (p.st.label === 'Merma' && p.abrirMerma) {
    return (
      <button type="button" className={s.etiquetaBoton} onClick={p.abrirMerma}>
        {d.label} <span className={s.nota}>({d.nota}) · ver qué</span>
      </button>
    );
  }
  return <span className={s.etiqueta[p.st.kind === 'resta' ? 'resta' : 'total']}>{d.label}</span>;
}

function Fila(p: {
  readonly st: WaterfallStep;
  readonly i: number;
  readonly x: (v: Money | number) => number;
  readonly ventas: Money;
  readonly final: boolean;
  readonly abrirMerma?: () => void;
}) {
  const { st, x } = p;
  const izq = Math.min(x(st.desde), x(st.hasta));
  const ancho = Math.max(Math.abs(x(st.hasta) - x(st.desde)), 0.9);
  const valor = st.kind === 'resta' ? -st.monto : st.acumulado;
  return (
    <div
      role="row"
      className={s.fila[p.final ? (valor < 0n ? 'finalMal' : 'finalBien') : st.kind]}
      data-paso={st.label}
    >
      <span role="cell" className={s.rotulo}>
        <Etiqueta st={st} abrirMerma={p.abrirMerma} />
        <span className={s.share}>{share(st, p.i, p.ventas)}</span>
      </span>
      <span role="cell" className={s.pista} aria-hidden="true">
        <span className={s.cero} style={{ left: `${x(0)}%` }} />
        <span
          className={`${s.barra[tono(st)]} ${p.final ? s.barraFinal : ''}`}
          style={{ left: `${izq}%`, width: `${ancho}%`, animationDelay: `${p.i * 80}ms` }}
        />
      </span>
      <span
        role="cell"
        className={s.valor[valor < 0n ? 'mal' : st.kind === 'total' ? 'bien' : 'neutro']}
      >
        {valor < 0n ? '−' : ''}
        {formatMoneyEntero(valor < 0n ? -valor : valor)}
      </span>
    </div>
  );
}

export function Cascada(props: {
  readonly steps: readonly WaterfallStep[];
  readonly hablada: string;
  readonly abrirMerma?: () => void;
}) {
  const x = escala(props.steps);
  const ventas = props.steps[0]?.acumulado ?? 0n;
  return (
    <div role="table" aria-label={props.hablada} className={s.tabla}>
      {props.steps.map((st, i) => (
        <Fila
          key={st.label}
          st={st}
          i={i}
          x={x}
          ventas={ventas}
          final={i === props.steps.length - 1}
          abrirMerma={props.abrirMerma}
        />
      ))}
    </div>
  );
}

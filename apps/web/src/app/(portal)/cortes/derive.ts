import {
  diferenciaCorte,
  efectivoEsperado,
  formatMoney,
  sum,
  totalContado,
  type DiferenciaCorte,
  type Money,
} from '@xangarro/domain';

import { enPalabras } from '../../../operador/inicio/copy';
import { matches } from '../../../operador/ui/search';
import type { Corte, EstadoCorte, Evento, FiltroCortes } from './types';

/** The domain's calculator over the corte's four parts (O-03). */
export const esperado = (c: Corte): Money =>
  efectivoEsperado({
    fondo: c.fondo,
    ventasEfectivo: [c.ventasEfectivo],
    abonosEfectivo: [c.abonosEfectivo],
    gastosCaja: [c.gastosCaja],
  });

export const contado = (c: Corte): Money => totalContado(c.conteo);

export const diferencia = (c: Corte): DiferenciaCorte => diferenciaCorte(contado(c), esperado(c));

/** «−$60.00», «+$40.00», «$0.00». */
export function conSigno(d: DiferenciaCorte): string {
  if (d.tipo === 'cuadra') return formatMoney(d.monto);
  return `${d.tipo === 'falta' ? '−' : '+'}${formatMoney(d.monto)}`;
}

export function filtrar(
  cortes: readonly Corte[],
  filtro: FiltroCortes,
  estado: (c: Corte) => EstadoCorte,
  query: string,
): readonly Corte[] {
  return cortes
    .filter((c) => {
      if (filtro === 'Todos') return true;
      if (filtro === 'Por aclarar') return estado(c) === 'Por aclarar';
      if (filtro === 'Con diferencia') return diferencia(c).tipo !== 'cuadra';
      return c.caja === filtro;
    })
    .filter((c) => matches(query, `${c.operador} ${c.caja} ${c.dia} · ${c.horario}`));
}

/** The four KPIs: count, pending review, the month's net difference, and how many balanced. */
export function resumen(cortes: readonly Corte[], estado: (c: Corte) => EstadoCorte) {
  const neto = sum(
    cortes.map((c) => {
      const d = diferencia(c);
      return d.tipo === 'falta' ? -d.monto : d.monto;
    }),
  );
  const cajas = new Set(cortes.map((c) => c.caja)).size;
  const personas = new Set(cortes.map((c) => c.operador)).size;
  return {
    cortes: cortes.length,
    equipo: `${enPalabras(cajas)} cajas, ${enPalabras(personas).toLowerCase()} personas`,
    porAclarar: cortes.filter((c) => estado(c) === 'Por aclarar').length,
    neto,
    cuadraron: cortes.filter((c) => diferencia(c).tipo === 'cuadra').length,
  };
}

export const netoTexto = (neto: Money): string =>
  `${neto < 0n ? '−' : ''}${formatMoney(neto < 0n ? -neto : neto)}`;

export const aclarado = (c: Corte) =>
  `El corte de ${c.operador} del ${c.dia} queda cerrado. La diferencia se registra como ajuste de caja.`;

/** «Pedir aclaración» sends the operator a message they read in Avisos (ADR-075). */
export const aclaracion = (c: Corte) =>
  `A ${c.operador.split(' ')[0] ?? c.operador} le llega el detalle del corte en sus Avisos. Cuando responda, su respuesta aparece en los tuyos.`;

/** «Qué más pasó en el turno»: a zero reads «Ninguna» / «Ninguno» on white. */
export function eventos(c: Corte): readonly Evento[] {
  const t = c.turno;
  const { n, monto } = t.canceladas;
  return [
    { label: 'Ventas capturadas', value: String(t.ventas), tone: 'plain' },
    n === 0
      ? { label: 'Ventas canceladas', value: 'Ninguna', tone: 'plain' }
      : { label: 'Ventas canceladas', value: `${n} · ${formatMoney(monto)}`, tone: 'danger' },
    t.fiado === 0n
      ? { label: 'Ventas fiadas', value: 'Ninguna', tone: 'plain' }
      : { label: 'Ventas fiadas', value: formatMoney(t.fiado), tone: 'warning' },
    { label: 'Movimientos de inventario', value: t.inventario, tone: 'plain' },
    t.creados === 0
      ? { label: 'Productos creados en caja', value: 'Ninguno', tone: 'plain' }
      : { label: 'Productos creados en caja', value: String(t.creados), tone: 'soft' },
  ];
}

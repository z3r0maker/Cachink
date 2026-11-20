import { formatMoney, type Money } from '@xangarro/domain';
import {
  CATEGORIAS_GASTO,
  montoAprobado,
  nombreTrimestre,
  estadoDeSolicitud,
  ultimoDiaDelTrimestre,
  totalMensual,
  ultimoDia,
  type CategoriaGasto,
  type Montos,
  type Presupuesto,
  type SolicitudGasto,
} from '@xangarro/domain/corp';

import { fechaCorta, nombreMes } from './fechas';
import type { Calculo } from './presupuesto-calculo';
import {
  hrefCategoria,
  nombreCategoria,
  porcentaje,
  type VistaPresupuesto,
} from './presupuesto-view';

/**
 * Board CD-15d's four tiles and its bars by category: spent in the
 * category's colour, the projection behind it and the budget's marker, each
 * with its figures as text. Only with a budget in force. Pure.
 */
export interface Tile {
  readonly label: string;
  readonly valor: string;
  readonly nota: string;
  /** The projection goes over: the tile is a warning. */
  readonly aviso: boolean;
}

export interface Linea {
  readonly categoria: CategoriaGasto;
  readonly nombre: string;
  readonly cifras: string;
  readonly nota: string;
  readonly sobre: boolean;
  readonly href: string;
  /** Widths on a 0–100 scale shared by the four bars. */
  readonly real: number;
  readonly proyeccion: number;
  readonly presupuesto: number;
}

const total = (m: Montos) => totalMensual(m);
const veces = (vista: VistaPresupuesto) => (vista === 'trimestre' ? 3n : 1n);

export const delPeriodo = (c: Calculo, vista: VistaPresupuesto) =>
  vista === 'trimestre' ? c.delTrimestre : c.delMes;

export function solicitudesDe(
  ss: readonly SolicitudGasto[],
  c: Calculo,
  vista: VistaPresupuesto,
): readonly SolicitudGasto[] {
  return vista === 'trimestre' ? ss : ss.filter((s) => s.periodo === c.mes);
}

function excesos(p: Presupuesto, proy: Montos, k: bigint) {
  const sobre = CATEGORIAS_GASTO.filter((cat) => proy[cat] > p.montos[cat] * k);
  const monto = sobre.reduce((t, cat) => t + proy[cat] - p.montos[cat] * k, 0n);
  return { monto, nombres: sobre.map(nombreCategoria).join(', ') };
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

function notaFuera(ss: readonly SolicitudGasto[], vista: VistaPresupuesto): string {
  const gastos = ss.filter((s) => montoAprobado(s) > 0n).length;
  const pendientes = ss.filter((s) => estadoDeSolicitud(s) === 'pendiente').length;
  const donde = vista === 'trimestre' ? ' en el trimestre' : '';
  if (gastos === 0 && pendientes === 0) return `Ninguno${donde === '' ? ' este mes' : donde}`;
  const partes = [`${plural(gastos, 'gasto', 'gastos')}${donde}`];
  if (pendientes > 0) partes.push(`${plural(pendientes, 'solicitud', 'solicitudes')} por aprobar`);
  return partes.join(' · ');
}

function notaGastado(c: Calculo, gastado: bigint, presupuesto: bigint): string {
  const dia = BigInt(Number(c.hoy.slice(8, 10)));
  const dias = BigInt(Number(ultimoDia(c.mes).slice(8, 10)));
  const delMes = porcentaje(dia, dias) ?? '0 %';
  return `${porcentaje(gastado, presupuesto) ?? '0 %'} del presupuesto en ${delMes} del mes`;
}

const tile = (label: string, valor: Money, nota: string, aviso = false): Tile => ({
  label,
  valor: formatMoney(valor),
  nota,
  aviso,
});

function presupuestoTile(c: Calculo, p: Presupuesto, vista: VistaPresupuesto): Tile {
  const mensual = total(p.montos);
  return vista === 'trimestre'
    ? tile(
        `Presupuesto del ${nombreTrimestre(c.trimestre)}`,
        mensual * 3n,
        `${formatMoney(mensual)} al mes · 4 categorías`,
      )
    : tile(`Presupuesto de ${nombreMes(c.mes)}`, mensual, '4 categorías');
}

function proyeccionTile(c: Calculo, p: Presupuesto, vista: VistaPresupuesto): Tile {
  const g = delPeriodo(c, vista);
  const e = excesos(p, g.proyeccion, veces(vista));
  const fin = fechaCorta(ultimoDiaDelTrimestre(c.trimestre));
  const label = vista === 'trimestre' ? `Proyección al ${fin}` : 'Proyección a fin de mes';
  const nota =
    e.monto > 0n
      ? `Se pasaría por ${formatMoney(e.monto)} (${e.nombres})`
      : 'Dentro del presupuesto';
  return tile(label, total(g.proyeccion), nota, e.monto > 0n);
}

export function tilesDe(
  c: Calculo,
  p: Presupuesto,
  ss: readonly SolicitudGasto[],
  vista: VistaPresupuesto,
  avanceTrimestre: string,
): readonly Tile[] {
  const gastado = total(delPeriodo(c, vista).gastado);
  const fuera = solicitudesDe(ss, c, vista);
  const notaGasto =
    vista === 'trimestre' ? avanceTrimestre : notaGastado(c, gastado, total(p.montos));
  return [
    presupuestoTile(c, p, vista),
    tile(`Gastado al ${fechaCorta(c.hoy)}`, gastado, notaGasto),
    proyeccionTile(c, p, vista),
    tile(
      'Fuera del presupuesto',
      fuera.reduce((t, s) => t + montoAprobado(s), 0n),
      notaFuera(fuera, vista),
    ),
  ];
}

const escala = (v: bigint, max: bigint) => (v <= 0n ? 0 : Number((v * 1000n) / max) / 10);

export function lineasDe(c: Calculo, p: Presupuesto, vista: VistaPresupuesto): readonly Linea[] {
  const k = veces(vista);
  const g = delPeriodo(c, vista);
  const valores = CATEGORIAS_GASTO.flatMap((cat) => [
    p.montos[cat] * k,
    g.proyeccion[cat],
    g.gastado[cat],
  ]);
  const max = valores.reduce((a, b) => (b > a ? b : a), 1n);
  return CATEGORIAS_GASTO.map((cat) => {
    const budget = p.montos[cat] * k;
    const proy = g.proyeccion[cat];
    const sobre = proy > budget;
    return {
      categoria: cat,
      nombre: nombreCategoria(cat),
      cifras: `${formatMoney(g.gastado[cat])} de ${formatMoney(budget)}`,
      nota: sobre
        ? `Proyección ${formatMoney(proy)} · se pasaría por ${formatMoney(proy - budget)}`
        : `Proyección ${formatMoney(proy)} · dentro`,
      sobre,
      href: hrefCategoria(cat, c.mes),
      real: escala(g.gastado[cat], max),
      proyeccion: escala(proy, max),
      presupuesto: escala(budget, max),
    };
  });
}

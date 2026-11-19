import { formatMoney } from '@xangarro/domain';
import {
  nombreTrimestre,
  rangoDelTrimestre,
  totalMensual,
  type Presupuesto,
} from '@xangarro/domain/corp';

import { diaDe, fechaLarga, nombreMes } from './fechas';
import type { Calculo } from './presupuesto-calculo';
import {
  hrefPresupuesto,
  mesesDelTrimestre,
  nombreDe,
  otroSocio,
  type VistaPresupuesto,
} from './presupuesto-view';

/**
 * The top of board CD-15d: the line under the title, the budget in force
 * and who approved it, the notice of a budget waiting, «Preparar …», and the
 * empty state of a quarter with no budget. Pure.
 */
export interface Aviso {
  readonly titulo: string;
  readonly texto: string;
  /** «Revisar y aprobar», only for the founder who answers. */
  readonly href: string | null;
}

export interface Encabezado {
  readonly sub: string;
  readonly aprobado: string | null;
  /** «Preparar el presupuesto del …», when a quarter can take one. */
  readonly preparar: { readonly texto: string; readonly href: string } | null;
  readonly aviso: Aviso | null;
  readonly vacio: { readonly titulo: string; readonly texto: string } | null;
}

const cap = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

function subDe(c: Calculo, vista: VistaPresupuesto): string {
  const t = nombreTrimestre(c.trimestre);
  if (vista === 'mes') {
    return `${cap(nombreMes(c.mes))} de ${c.mes.slice(0, 4)} · al día ${Number(c.hoy.slice(8, 10))} · ${t}`;
  }
  const meses = mesesDelTrimestre(c.trimestre);
  return `${t} · ${nombreMes(meses[0] ?? c.mes)} a ${nombreMes(meses[2] ?? c.mes)}, al ${fechaLarga(c.hoy)}`;
}

function avisoDe(
  p: Presupuesto,
  c: Calculo,
  socios: ReadonlyMap<string, string>,
  founderId: string,
): Aviso {
  const t = nombreTrimestre(p.trimestre);
  const monto = formatMoney(totalMensual(p.montos));
  if (p.preparadoPor === founderId) {
    return {
      titulo: `Enviaste el presupuesto del ${t} a ${otroSocio(socios, founderId)}: ${monto} al mes`,
      texto: `El ${diaDe(p.preparadoAt)}. Cuenta desde que lo apruebe.`,
      href: null,
    };
  }
  const inicio = fechaLarga(rangoDelTrimestre(p.trimestre)[0]);
  return {
    titulo: `${nombreDe(socios, p.preparadoPor)} preparó el presupuesto del ${t}: ${monto} al mes`,
    texto:
      p.trimestre === c.trimestre
        ? `Enviado el ${diaDe(p.preparadoAt)}. Cuenta desde que lo apruebes.`
        : `Enviado el ${diaDe(p.preparadoAt)}. Empieza a contar el ${inicio}, cuando lo apruebes.`,
    href: hrefPresupuesto('mes', 'aprobar'),
  };
}

function aprobadoDe(p: Presupuesto, socios: ReadonlyMap<string, string>): string {
  const r = p.respuesta;
  const quien =
    r === null
      ? ''
      : ` por ${nombreDe(socios, p.preparadoPor)} y ${nombreDe(socios, r.founderId)} el ${diaDe(r.at)}`;
  return `Presupuesto del ${nombreTrimestre(p.trimestre)} · aprobado${quien} · ${formatMoney(totalMensual(p.montos))} al mes`;
}

function vacioDe(c: Calculo, socios: ReadonlyMap<string, string>) {
  const t = nombreTrimestre(c.trimestre);
  const p = c.pendiente?.trimestre === c.trimestre ? c.pendiente : null;
  const promedio = totalMensual(c.promedioAnterior);
  const texto =
    p !== null
      ? `${nombreDe(socios, p.preparadoPor)} lo preparó el ${diaDe(p.preparadoAt)}; cuenta desde que ${otroSocio(socios, p.preparadoPor)} lo apruebe.`
      : promedio > 0n
        ? `Prepáralo con lo gastado en el ${nombreTrimestre(c.anterior)} como punto de partida: ${formatMoney(promedio)} al mes en promedio. Cuenta desde que el otro socio lo aprueba.`
        : 'Prepáralo con un monto al mes por categoría. Cuenta desde que el otro socio lo aprueba.';
  return { titulo: `El ${t} aún no tiene presupuesto`, texto };
}

/** With no budget in force only this quarter is offered; with one, the next. */
export function trimestreParaPreparar(c: Calculo): string | null {
  const t = c.vigente === null ? c.trimestre : c.siguiente;
  return c.aPreparar === t ? t : null;
}

export function encabezadoDe(
  c: Calculo,
  socios: ReadonlyMap<string, string>,
  founderId: string,
  vista: VistaPresupuesto,
): Encabezado {
  const t = trimestreParaPreparar(c);
  return {
    sub: subDe(c, vista),
    aprobado: c.vigente === null ? null : aprobadoDe(c.vigente, socios),
    preparar:
      t === null
        ? null
        : {
            texto: `Preparar el presupuesto del ${nombreTrimestre(t)}`,
            href: hrefPresupuesto(vista, 'preparar'),
          },
    aviso: c.pendiente === null ? null : avisoDe(c.pendiente, c, socios, founderId),
    vacio: c.vigente === null ? vacioDe(c, socios) : null,
  };
}

/** «Octubre completo y noviembre al día 19», the quarter's progress under «Gastado». */
export function avanceDelTrimestre(c: Calculo): string {
  const meses = mesesDelTrimestre(c.trimestre)
    .filter((m) => m < c.mes)
    .map(nombreMes);
  const hoy = `${nombreMes(c.mes)} al día ${Number(c.hoy.slice(8, 10))}`;
  if (meses.length === 0) return cap(hoy);
  const completos = meses.length === 1 ? `${meses[0]} completo` : `${meses.join(' y ')} completos`;
  return `${cap(completos)} y ${hoy}`;
}

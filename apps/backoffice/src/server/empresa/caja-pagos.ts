import { formatMoney } from '@xangarro/domain';
import type { RecurrenteDelMes } from '@xangarro/domain/corp';

import type { DatosCaja } from './caja-view';
import { fechaCorta, nombreMes, sumarDias } from './fechas';
import { hrefImpuestos, type MesImpuestos } from './impuestos-view';
import { montoEstimado } from './recurrentes-view';

/**
 * «Pagos de los próximos 30 días» (E-23, board CD-15c): what the console
 * already knows is coming: the recurring charges not yet registered, at their
 * usual amount, and an ISR e IVA not yet paid, declared or estimated. A
 * dollar charge stays in dollars: its peso amount is only known when paid.
 */
export const DIAS = 30;

export interface Pago {
  readonly key: string;
  readonly fecha: string;
  readonly dia: string;
  readonly nombre: string;
  readonly fuente: string;
  readonly monto: string;
  readonly href: string;
}

export interface Pagos {
  readonly pagos: readonly Pago[];
  /** «$9,264.00», plus «+ USD 45.00» when a charge is in dollars. */
  readonly total: string;
}

const enRango = (fecha: string, hoy: string) => fecha >= hoy && fecha <= sumarDias(hoy, DIAS);

function deRecurrente(r: RecurrenteDelMes): Pago {
  return {
    key: `${r.plantilla.id}:${r.fecha}`,
    fecha: r.fecha,
    dia: fechaCorta(r.fecha),
    nombre: r.plantilla.nombre,
    fuente:
      r.plantilla.periodicidad === 'anual' ? 'Recurrente · cada año' : 'Recurrente · cada mes',
    monto: montoEstimado(r.plantilla),
    href: '/empresa/movimientos?ver=recurrentes',
  };
}

function deImpuestos(m: MesImpuestos): Pago {
  const declarado = m.comparacion.total.declarado;
  return {
    key: `impuestos:${m.mes}`,
    fecha: m.vence,
    dia: fechaCorta(m.vence),
    nombre: `ISR e IVA de ${nombreMes(m.mes)}`,
    fuente:
      declarado === null ? 'Estimado en Impuestos · aún sin declarar' : 'Declarado en Impuestos',
    monto: formatMoney(aPagar(m)),
    href: hrefImpuestos(m.mes),
  };
}

const aPagar = (m: MesImpuestos) => m.comparacion.total.declarado ?? m.comparacion.total.estimado;

function totalDe(recurrentes: readonly RecurrenteDelMes[], impuestos: readonly MesImpuestos[]) {
  const de = (moneda: 'MXN' | 'USD') =>
    recurrentes
      .filter((r) => r.plantilla.moneda === moneda)
      .reduce((t, r) => t + r.plantilla.montoEstimado, 0n);
  const mxn = de('MXN') + impuestos.reduce((t, m) => t + aPagar(m), 0n);
  const usd = de('USD');
  return usd === 0n
    ? formatMoney(mxn)
    : `${formatMoney(mxn)} + USD ${formatMoney(usd).replace('$', '')}`;
}

export function pagosDe(d: DatosCaja): Pagos {
  const recurrentes = d.recurrentes.filter(
    (r) => r.estado !== 'registrado' && r.plantilla.montoEstimado > 0n && enRango(r.fecha, d.hoy),
  );
  const impuestos = d.impuestos.filter(
    (m) => m.estado !== 'pagada' && enRango(m.vence, d.hoy) && m.comparacion.total.estimado > 0n,
  );
  const pagos = [...recurrentes.map(deRecurrente), ...impuestos.map(deImpuestos)].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.nombre.localeCompare(b.nombre),
  );
  return { pagos, total: totalDe(recurrentes, impuestos) };
}

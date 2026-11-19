import { formatMoney } from '@xangarro/domain';
import { CERCA_DEL_LIMITE, proximoCargo, usoDelPlan, type Servicio } from '@xangarro/domain/corp';

import { diasEntre, fechaLarga, nombreMes } from './fechas';
import type { Senal } from './resumen-senales';
import { hrefServicio, montoEn, type DatosServicios } from './servicios-textos';
import { lecturaDe } from './servicios-uso-view';

/**
 * Servicios' signals on the Resumen (E-24, boards CD-18c and CD-18d): a
 * usage service projected past its alert, a free plan from 60 % of its limit,
 * and an annual one renewing within 30 days. Pure.
 */
export const DIAS_RENOVACION = 30;

const accion = (s: Servicio) => ({ accion: 'Ver servicio', href: hrefServicio(s.id) });

function pasaDelAviso(s: Servicio, hoy: string): Senal[] {
  const p = lecturaDe(s, hoy)?.proyeccion;
  if (p == null || s.aviso === null || p.monto <= s.aviso) return [];
  return [
    {
      titulo: `${s.nombre} va a pasar de su aviso`,
      porque: `A este ritmo ${nombreMes(hoy.slice(0, 7))} cierra en ${formatMoney(p.monto)}; el aviso es de ${formatMoney(s.aviso)}.`,
      ...accion(s),
      tono: 'warn',
    },
  ];
}

function cercaDelLimite(s: Servicio): Senal[] {
  if (s.cobro !== 'gratis' || s.limite === null || s.usoPlan === null) return [];
  const pct = usoDelPlan(s.usoPlan, s.limite);
  if (pct < CERCA_DEL_LIMITE) return [];
  return [
    {
      titulo: `${s.nombre} va en ${pct} % de su plan gratis`,
      porque: 'La señal se enciende desde 60 %. Revisa el plan de pago antes de llegar al límite.',
      ...accion(s),
      tono: pct >= 90 ? 'warn' : 'info',
    },
  ];
}

function renueva(s: Servicio, hoy: string): Senal[] {
  if (s.cobro !== 'anual' || s.monto === null) return [];
  const f = proximoCargo(s, hoy);
  if (f === null || diasEntre(hoy, f) > DIAS_RENOVACION) return [];
  return [
    {
      titulo: `${s.nombre} renueva el ${fechaLarga(f)}`,
      porque: `Su cargo del año es de ${montoEn(s.moneda, s.monto)}.`,
      ...accion(s),
      tono: 'info',
    },
  ];
}

export function senalesDeServicios(d: Pick<DatosServicios, 'servicios' | 'hoy'>): Senal[] {
  return d.servicios
    .filter((s) => s.estado === 'activo')
    .flatMap((s) => [...pasaDelAviso(s, d.hoy), ...cercaDelLimite(s), ...renueva(s, d.hoy)]);
}

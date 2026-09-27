import { colors } from '@xangarro/tokens';
import { formatMoney, sum, type Money } from '@xangarro/domain';

import type { MetodoVenta } from '../types';
import type { VentaDetalle } from './types';

/** Where the sale stands: cancelled, waiting in the queue, or sent. */
export type EstadoEnvio = 'cancelada' | 'en-cola' | 'enviada';

export const ESTADO_ENVIO: Readonly<
  Record<EstadoEnvio, { readonly texto: string; readonly bg: string; readonly fg: string }>
> = {
  enviada: { texto: 'Enviada', bg: colors.greenSoft, fg: colors.greenText },
  'en-cola': { texto: 'En espera de enviarse', bg: colors.warningSoft, fg: colors.warningText },
  cancelada: { texto: 'Cancelada', bg: colors.redSoft, fg: colors.redText },
};

export function estadoDe(v: VentaDetalle): EstadoEnvio {
  if (v.cancelada) return 'cancelada';
  return v.enCola ? 'en-cola' : 'enviada';
}

/** The ticket's total: stated, or the sum of its priced lines. */
export function totalDe(v: VentaDetalle): Money {
  return v.total ?? sum(v.lineas.map((l) => (l.precio ?? 0n) * BigInt(l.cantidad)));
}

const COMO: Readonly<Record<MetodoVenta, string>> = {
  Efectivo: 'en efectivo',
  Tarjeta: 'con tarjeta',
  Transferencia: 'por transferencia',
  Fiado: 'fiado',
};

/** «Hoy 14:52 · en efectivo», «Hoy 14:04 · fiado a Doña Mari de la tienda». */
export function subtitulo(v: VentaDetalle): string {
  const como = v.fiado ? `fiado a ${v.fiado.cliente}` : COMO[v.metodo];
  return `${v.cuando} · ${como}`;
}

export interface Ficha {
  readonly k: string;
  readonly v: string;
  readonly color?: string;
}

/** Who, where and how (the board's four tiles): the first pair changes with the sale. */
export function fichas(
  v: VentaDetalle,
  ctx: { readonly operador: string; readonly caja: string; readonly desde: string },
): readonly Ficha[] {
  return [
    ...primeras(v, ctx.desde),
    { k: 'Quién cobró', v: v.capturo ?? ctx.operador },
    { k: 'En qué caja', v: ctx.caja },
  ];
}

function primeras(v: VentaDetalle, desde: string): readonly Ficha[] {
  if (v.cancelada)
    return [
      { k: 'Cómo pagó', v: v.metodo },
      { k: 'Motivo', v: v.cancelada.motivo },
    ];
  if (v.fiado) {
    const saldo = v.fiado.saldo;
    return [
      { k: 'Cliente', v: v.fiado.cliente },
      saldo === undefined
        ? { k: 'Cómo pagó', v: 'Fiado' }
        : { k: 'Ahora debe', v: formatMoney(saldo), color: colors.warningText },
    ];
  }
  if (v.recibido !== undefined)
    return [
      { k: 'Recibiste', v: formatMoney(v.recibido) },
      { k: 'Cambio que diste', v: formatMoney(v.recibido - totalDe(v)) },
    ];
  return [
    { k: 'Cómo pagó', v: v.metodo },
    { k: 'Turno', v: `Hoy, desde ${desde}` },
  ];
}

/** The cancel dialog's consequence line, by how the sale was paid. */
export function consecuencia(
  metodo: MetodoVenta,
  monto: Money,
  cliente?: string,
  dueno = 'Pedro',
): string {
  if (metodo === 'Fiado' && cliente !== undefined)
    return `Al cancelarla, el saldo de ${cliente} baja ${formatMoney(monto)}. Si ya abonó contra esta venta, ese dinero queda como saldo a favor suyo para su siguiente compra.`;
  if (metodo === 'Efectivo')
    return `Se regresan ${formatMoney(monto)} del efectivo esperado y ${dueno} lo ve en su portal.`;
  return `Sale de tus ventas del turno y ${dueno} lo ve en su portal. Si hay que devolver el dinero, se hace por el mismo medio.`;
}

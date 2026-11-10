import { splitIvaIncluded } from '@xangarro/application/cfdi';
import type { IngresoDelPeriodo } from '@xangarro/data-pg';
import { formatMoney } from '@xangarro/domain';

import { hoyEnMexico } from '../db/corp';
import { fechaCorta, nombreMes } from './fechas';
import { reembolsado } from './ingresos-fuente';

/**
 * Facturas › Emitidas as board CD-06i shows it (E-10): a month of Xangarro's
 * Stripe payments, every one already collected, with the CFDI each got; the
 * month's «Público en general» global; and the cobro the import posted. It
 * only reads: what is left to issue is resolved in the inbox (ADR-070).
 */
export type EstadoCfdi =
  | 'Timbrada'
  | 'Por emitir'
  | 'En la global'
  | 'Fuera de la global'
  | 'Cancelación pedida'
  | 'Cancelada';

export interface FilaEmitida {
  readonly key: string;
  readonly fecha: string;
  readonly cliente: string;
  readonly sub: string;
  readonly subtotal: string;
  readonly iva: string;
  readonly total: string;
  readonly estado: EstadoCfdi;
  readonly nota: string;
  /** Its «pago sin CFDI» item in the inbox, while it waits for one. */
  readonly emitirHref: string | null;
  readonly movimiento: { readonly href: string | null; readonly texto: string };
}

export interface ResumenEmitidas {
  /** Payments not refunded in full. */
  readonly pagos: number;
  readonly cobradoConIva: bigint;
  readonly cobradoSinIva: bigint;
  readonly iva: bigint;
  readonly porEmitir: number;
  readonly canceladas: number;
}

export interface GlobalDelMes {
  readonly pagos: number;
  readonly total: string;
  readonly timbrada: boolean;
  readonly uuid: string | null;
  readonly bandejaHref: string | null;
}

export interface Emitidas {
  readonly resumen: ResumenEmitidas;
  readonly global: GlobalDelMes | null;
  readonly filas: readonly FilaEmitida[];
}

export interface Contexto {
  readonly mes: string;
  /** Payment id → the cobro the import posted, and whether it was reversed. */
  readonly cobros: ReadonlyMap<string, { readonly id: string; readonly revertida: boolean }>;
  /** Payment ref (or `cfdi-global:<mes>`) → its open inbox item. */
  readonly bandeja: ReadonlyMap<string, string>;
}

const ESTADO: Record<IngresoDelPeriodo['status'], EstadoCfdi> = {
  stamped: 'Timbrada',
  manual: 'Por emitir',
  claimed: 'Por emitir',
  pending_global: 'En la global',
  in_global: 'En la global',
  excluded_from_global: 'Fuera de la global',
  cancel_requested: 'Cancelación pedida',
  cancelled: 'Cancelada',
};

const FORMA: Readonly<Record<string, string>> = {
  '04': 'tarjeta',
  '28': 'tarjeta',
  '03': 'transferencia',
};

const bandejaHref = (id: string | undefined) => (id === undefined ? null : `/inbox/${id}`);

function subDe(i: IngresoDelPeriodo): string {
  const quien = i.receptorRfc === null ? 'Sin datos fiscales' : `RFC ${i.receptorRfc}`;
  return [quien, i.description, FORMA[i.formaPago] ?? ''].filter((p) => p !== '').join(' · ');
}

function notaDe(i: IngresoDelPeriodo, mes: string): string {
  if (i.status === 'cancelled') {
    return i.notasDeCreditoCentavos > 0n
      ? `Reembolso · nota de crédito por ${formatMoney(i.notasDeCreditoCentavos)}`
      : 'Reembolso';
  }
  if (i.route === 'global') return `Factura global de ${nombreMes(mes)}`;
  return i.complementUuid === null ? '' : 'Con su complemento de pago';
}

function movimientoDe(i: IngresoDelPeriodo, c: Contexto): FilaEmitida['movimiento'] {
  const cobro = c.cobros.get(i.paymentId);
  if (cobro === undefined) {
    // Refunded before the import saw it: it never posts (importarCobros).
    return { href: null, texto: reembolsado(i) ? 'No se registró' : 'Se importa mañana' };
  }
  return {
    href: `/empresa/movimientos/${cobro.id}`,
    texto: cobro.revertida ? 'Revertido' : 'Cobro',
  };
}

function filaDe(i: IngresoDelPeriodo, c: Contexto): FilaEmitida {
  const { subtotal, iva } = splitIvaIncluded(i.totalCentavos);
  const estado = ESTADO[i.status];
  return {
    key: i.paymentId,
    fecha: fechaCorta(hoyEnMexico(new Date(i.paidAt))),
    cliente: i.receptorNombre ?? 'Público en general',
    sub: subDe(i),
    subtotal: formatMoney(subtotal),
    iva: formatMoney(iva),
    total: formatMoney(i.totalCentavos),
    estado,
    nota: notaDe(i, c.mes),
    emitirHref:
      estado === 'Por emitir' ? (bandejaHref(c.bandeja.get(i.paymentId)) ?? '/inbox') : null,
    movimiento: movimientoDe(i, c),
  };
}

function resumenDe(ingresos: readonly IngresoDelPeriodo[]): ResumenEmitidas {
  const cobrados = ingresos.filter((i) => !reembolsado(i));
  const conIva = cobrados.reduce((acc, i) => acc + i.totalCentavos, 0n);
  const sinIva = cobrados.reduce((acc, i) => acc + splitIvaIncluded(i.totalCentavos).subtotal, 0n);
  return {
    pagos: cobrados.length,
    cobradoConIva: conIva,
    cobradoSinIva: sinIva,
    iva: conIva - sinIva,
    porEmitir: ingresos.filter((i) => ESTADO[i.status] === 'Por emitir').length,
    canceladas: ingresos.filter((i) => i.status === 'cancelled').length,
  };
}

/** The month's «Público en general» global: its payments, stamped once all are in it. */
function globalDe(ingresos: readonly IngresoDelPeriodo[], c: Contexto): GlobalDelMes | null {
  const pagos = ingresos.filter(
    (i) => i.route === 'global' && (i.status === 'pending_global' || i.status === 'in_global'),
  );
  if (pagos.length === 0) return null;
  const timbrada = pagos.every((i) => i.status === 'in_global' && i.globalUuid !== null);
  return {
    pagos: pagos.length,
    total: formatMoney(pagos.reduce((acc, i) => acc + i.totalCentavos, 0n)),
    timbrada,
    uuid: timbrada ? (pagos[0]?.globalUuid ?? null) : null,
    bandejaHref: timbrada ? null : bandejaHref(c.bandeja.get(`cfdi-global:${c.mes}`)),
  };
}

export function emitidasDelMes(ingresos: readonly IngresoDelPeriodo[], c: Contexto): Emitidas {
  return {
    resumen: resumenDe(ingresos),
    global: globalDe(ingresos, c),
    filas: ingresos.map((i) => filaDe(i, c)),
  };
}

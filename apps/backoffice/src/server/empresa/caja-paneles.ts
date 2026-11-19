import { formatMoney } from '@xangarro/domain';
import {
  devolverCabe,
  flujoPorTipo,
  reservaMinima,
  type Autonomia,
  type TipoFlujo,
} from '@xangarro/domain/corp';

import type { DatosCaja } from './caja-view';
import { fechaCorta, nombreMes } from './fechas';
import { mesesVecinos } from './movimiento-view';
import { llamadaAbierta } from './socios-view';

/**
 * The two panels under Caja's chart (E-23, board CD-15c): what came in and
 * went out last month by kind, partner money apart; and the partners' open
 * funding call and loans still owed. The next 30 days are `caja-pagos.ts`.
 */
export interface Renglon {
  readonly label: string;
  readonly valor: string;
  readonly tipo: 'entra' | 'sale' | 'total' | 'aparte';
}

const ETIQUETA: Record<TipoFlujo, string> = {
  cobros: 'Cobros de clientes (con IVA)',
  gastos: 'Gastos de operación (con IVA)',
  impuestos: 'Impuestos pagados',
  comisiones: 'Comisiones del banco y de Stripe',
  otros: 'Otros movimientos',
};

const signo = (v: bigint) => (v > 0n ? `+${formatMoney(v)}` : formatMoney(v));

export function flujoDe(d: DatosCaja): {
  readonly mes: string;
  readonly renglones: readonly Renglon[];
} {
  const mes = mesesVecinos(d.hoy.slice(0, 7)).anterior;
  const f = flujoPorTipo(d.movs, mes);
  return {
    mes,
    renglones: [
      ...f.tipos.map((t) => ({
        label: ETIQUETA[t.tipo],
        valor: signo(t.importe),
        tipo: t.importe > 0n ? ('entra' as const) : ('sale' as const),
      })),
      { label: 'Cambio en la operación', valor: signo(f.operacion), tipo: 'total' },
      {
        label: `Aparte: dinero de los socios en ${nombreMes(mes)}`,
        valor: signo(f.socios),
        tipo: 'aparte',
      },
    ],
  };
}

export interface Mitad {
  readonly texto: string;
  readonly pagada: boolean;
}

export interface FondeoAbierto {
  readonly titulo: string;
  readonly vence: string;
  readonly mitades: readonly Mitad[];
}

export interface Prestamo {
  readonly titulo: string;
  readonly saldo: string;
  readonly nota: string;
}

export function fondeoDe(d: DatosCaja): FondeoAbierto | null {
  const c = llamadaAbierta(d.calls);
  if (c === null) return null;
  return {
    titulo: `${c.concepto} · ${formatMoney(c.total)}`,
    vence: `vence el ${fechaCorta(c.vence)}`,
    mitades: ([1, 2] as const).map((s) => {
      const m = c.mitades[s];
      return m === null
        ? { texto: `${d.socios[s]} · falta ${formatMoney(c.porSocio)}`, pagada: false }
        : { texto: `${d.socios[s]} · pagó el ${fechaCorta(m.fecha)}`, pagada: true };
    }),
  };
}

/** What the company owes each partner, and whether today's cash could repay it. */
export function prestamosDe(d: DatosCaja, a: Autonomia): readonly Prestamo[] {
  const reserva = reservaMinima(a.sale);
  return ([1, 2] as const).flatMap((s) => {
    const saldo = d.cuentas[s].prestamo;
    if (saldo <= 0n) return [];
    return [
      {
        titulo: `Préstamo de ${d.socios[s]}`,
        saldo: formatMoney(saldo),
        nota: devolverCabe(a.caja, reserva, saldo)
          ? 'Por devolver. Con la caja de hoy se podría devolver sin bajar de la reserva mínima.'
          : 'Por devolver. Devolverlo hoy dejaría la caja debajo de la reserva mínima.',
      },
    ];
  });
}

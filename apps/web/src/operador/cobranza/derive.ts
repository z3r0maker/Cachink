import { sum, type Money } from '@xangarro/domain';

import { enPalabras } from '../inicio/copy';
import { matches } from '../ui/search';
import { abiertas, estadoCliente, estadoCuenta, ultimoAbono } from './cliente/derive';
import type { CuentaCliente } from './cliente/types';
import type { FiltroCobranza, MetodoAbono } from './types';

export type EstadoCliente = 'Al día' | 'Atrasado' | 'Sin saldo';

export const saldo = (c: CuentaCliente): Money => estadoCuenta(c).saldo;

export const estado = (c: CuentaCliente): EstadoCliente => estadoCliente(c, estadoCuenta(c));

/** «3 ventas abiertas · la más antigua V-0361 · 8 may», or when the last one was settled. */
export function resumenCliente(c: CuentaCliente): string {
  const vivas = abiertas(c, estadoCuenta(c));
  const vieja = vivas[0];
  if (!vieja) return `No debe nada. Última venta liquidada el ${ultimoAbono(c)?.dia ?? ''}.`;
  return `${vivas.length} ventas abiertas · la más antigua ${vieja.venta.folio} · ${vieja.venta.dia}`;
}

export function filtrar(
  cuentas: readonly CuentaCliente[],
  filtro: FiltroCobranza,
  query: string,
): readonly CuentaCliente[] {
  return cuentas
    .filter(
      (c) =>
        filtro === 'Todos' || (filtro === 'Con saldo' ? saldo(c) > 0n : estado(c) === 'Atrasado'),
    )
    .filter((c) => matches(query, `${c.nombre} ${c.telefono}`));
}

export interface AbonoDelDia {
  readonly id: string;
  readonly cliente: string;
  readonly detalle: string;
  readonly monto: Money;
  readonly metodo: MetodoAbono;
  readonly hora: string;
}

/** «Abonos que recibiste hoy»: every account's abonos dated `hoy`, newest first. */
export function abonosDeHoy(
  cuentas: readonly CuentaCliente[],
  hoy: string,
): readonly AbonoDelDia[] {
  return cuentas
    .flatMap((c) =>
      c.abonos
        .filter((a) => a.fecha.startsWith(hoy))
        .map((a) => ({
          id: a.id,
          cliente: c.nombre,
          detalle: a.nota ?? `${a.metodo} · abono a lo más antiguo`,
          monto: a.monto,
          metodo: a.metodo,
          hora: a.fecha.slice(11, 16),
        })),
    )
    .sort((a, b) => b.hora.localeCompare(a.hora));
}

/** «Tres abonos recibidos»; one reads «Un abono…» (apocope), not «Uno». */
const plural = (n: number, una: string, varias: string) =>
  n === 1 ? `Un ${una}` : `${enPalabras(n)} ${varias}`;

/** The three KPIs and their hints. */
export function resumen(cuentas: readonly CuentaCliente[], hoy: string) {
  const conSaldo = cuentas.filter((c) => saldo(c) > 0n).length;
  const delDia = abonosDeHoy(cuentas, hoy);
  return {
    porCobrar: sum(cuentas.map(saldo)),
    conSaldo: plural(conSaldo, 'cliente con saldo', 'clientes con saldo'),
    abonado: sum(delDia.map((a) => a.monto)),
    recibidos: plural(delDia.length, 'abono recibido', 'abonos recibidos'),
    efectivo: sum(delDia.filter((a) => a.metodo === 'Efectivo').map((a) => a.monto)),
  };
}

/** The whole balance first, then $100, $200 and $500 while they fit: at most four. */
export function rapidos(total: Money): readonly Money[] {
  return [...new Set([total, 100_00n, 200_00n, 500_00n])]
    .filter((v) => v > 0n && v <= total)
    .slice(0, 4);
}

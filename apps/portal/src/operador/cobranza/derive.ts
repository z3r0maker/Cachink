import { aplicarAbono, formatMoney, sum, type AplicacionAbono, type Money } from '@xangarro/domain';

import { enPalabras } from '../inicio/copy';
import { matches } from '../ui/search';
import type { AbonoHoy, ClienteCobranza, FiltroCobranza } from './types';

export const saldo = (c: ClienteCobranza): Money => sum(c.abiertas.map((v) => v.pendiente));

export type EstadoCliente = 'Al día' | 'Atrasado' | 'Sin saldo';

export function estado(c: ClienteCobranza): EstadoCliente {
  if (saldo(c) === 0n) return 'Sin saldo';
  return c.atrasado ? 'Atrasado' : 'Al día';
}

/** «3 ventas abiertas · la más antigua V-0361 · 8 may», or when the last one was settled. */
export function resumenCliente(c: ClienteCobranza): string {
  const vieja = c.abiertas.at(-1);
  if (!vieja) return `No debe nada. Última venta liquidada el ${c.ultimaLiquidada ?? ''}.`;
  return `${c.abiertas.length} ventas abiertas · la más antigua ${vieja.folio} · ${vieja.dia}`;
}

export function filtrar(
  clientes: readonly ClienteCobranza[],
  filtro: FiltroCobranza,
  query: string,
): readonly ClienteCobranza[] {
  return clientes
    .filter(
      (c) =>
        filtro === 'Todos' || (filtro === 'Con saldo' ? saldo(c) > 0n : estado(c) === 'Atrasado'),
    )
    .filter((c) => matches(query, `${c.nombre} ${c.telefono}`));
}

const plural = (n: number, una: string, varias: string) =>
  `${enPalabras(n)} ${n === 1 ? una : varias}`;

/** The three KPIs and their hints. */
export function resumen(clientes: readonly ClienteCobranza[], abonos: readonly AbonoHoy[]) {
  const conSaldo = clientes.filter((c) => saldo(c) > 0n).length;
  return {
    porCobrar: sum(clientes.map(saldo)),
    conSaldo: plural(conSaldo, 'cliente con saldo', 'clientes con saldo'),
    abonado: sum(abonos.map((a) => a.monto)),
    recibidos: plural(abonos.length, 'abono recibido', 'abonos recibidos'),
    efectivo: sum(abonos.filter((a) => a.metodo === 'Efectivo').map((a) => a.monto)),
  };
}

/** The whole balance first, then $100, $200 and $500 while they fit: at most four. */
export function rapidos(total: Money): readonly Money[] {
  return [...new Set([total, 100_00n, 200_00n, 500_00n])]
    .filter((v) => v > 0n && v <= total)
    .slice(0, 4);
}

/** The allocation over this client's open tickets, oldest first (domain, ADR-074). */
export const aplicar = (c: ClienteCobranza, monto: Money): AplicacionAbono =>
  aplicarAbono(
    c.abiertas.map((v) => ({ id: v.folio, fecha: v.fecha, pendiente: v.pendiente })),
    monto,
  );

/** «V-0361 · 8 may completa · V-0388 · 11 may parcial». */
export function aplicaTexto(c: ClienteCobranza, a: AplicacionAbono): string {
  return a.aplicaciones
    .map((x) => {
      const v = c.abiertas.find((y) => y.folio === x.ventaId);
      return `${x.ventaId} · ${v?.dia ?? ''} ${x.completa ? 'completa' : 'parcial'}`;
    })
    .join(' · ');
}

/** The client after the abono: settled tickets leave, a partial one owes less. */
export function abonar(c: ClienteCobranza, a: AplicacionAbono): ClienteCobranza {
  const abiertas = c.abiertas
    .map((v) => {
      const x = a.aplicaciones.find((y) => y.ventaId === v.folio);
      return x ? { ...v, pendiente: v.pendiente - x.aplicado } : v;
    })
    .filter((v) => v.pendiente > 0n);
  return { ...c, abiertas };
}

export const toastAbono = (nombre: string, metodo: string, a: AplicacionAbono) =>
  `${formatMoney(a.aplicado)} de ${nombre} por ${metodo.toLowerCase()}. Se aplicó a lo más antiguo; queda ${formatMoney(a.restante)}.`;

/** The modal's preview: «V-0361 · 8 may completa · …» and the balance left. */
export function vista(c: ClienteCobranza, monto: Money): { texto: string; restante: Money } {
  const a = aplicar(c, monto);
  return { texto: aplicaTexto(c, a), restante: a.restante };
}

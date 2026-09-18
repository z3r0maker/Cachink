import {
  aplicarAbono,
  disponible,
  estadoDeCuenta,
  formatMoney,
  type EstadoCuenta,
  type Money,
} from '@xangarro/domain';

import type { EstadoCliente } from '../derive';
import type { AbonoCuenta, CuentaCliente, VentaCuenta } from './types';

/** The domain derivation over the account's two facts (ADR-074). */
export const estadoCuenta = (c: CuentaCliente): EstadoCuenta =>
  estadoDeCuenta(
    c.ventas.map((v) => ({ id: v.folio, fecha: v.fecha, monto: v.monto })),
    c.abonos.map((a) => ({ id: a.id, fecha: a.fecha, monto: a.monto })),
  );

export function estadoCliente(c: CuentaCliente, e: EstadoCuenta): EstadoCliente {
  if (e.saldo === 0n) return 'Sin saldo';
  return c.atrasado ? 'Atrasado' : 'Al día';
}

export interface Abierta {
  readonly venta: VentaCuenta;
  readonly pagado: Money;
  readonly pendiente: Money;
  /** «la más antigua», «después de V-0288». */
  readonly orden: string;
}

/** Open tickets, oldest first, with what was already paid on each. */
export function abiertas(c: CuentaCliente, e: EstadoCuenta): readonly Abierta[] {
  const cuenta = new Map(e.ventas.map((v) => [v.id, v]));
  const vivas = [...c.ventas]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .flatMap((venta) => {
      const x = cuenta.get(venta.folio);
      return x && x.pendiente > 0n ? [{ venta, pagado: x.pagado, pendiente: x.pendiente }] : [];
    });
  return vivas.map((v, i) => ({
    ...v,
    orden: i === 0 ? 'la más antigua' : `después de ${vivas[i - 1]?.venta.folio ?? ''}`,
  }));
}

export const ultimoAbono = (c: CuentaCliente): AbonoCuenta | null =>
  [...c.abonos].sort((a, b) => b.fecha.localeCompare(a.fecha))[0] ?? null;

export const libre = (c: CuentaCliente, e: EstadoCuenta): Money => disponible(c.limite, e.saldo);

export interface Movimiento {
  readonly fecha: string;
  readonly tipo: 'fiado' | 'abono';
  readonly titulo: string;
  readonly detalle: string;
  readonly monto: Money;
}

/** Tickets and abonos, newest first; each abono says the last ticket it reached. */
export function historial(c: CuentaCliente, e: EstadoCuenta): readonly Movimiento[] {
  const ventas: Movimiento[] = c.ventas.map((v) => ({
    fecha: v.fecha,
    tipo: 'fiado',
    titulo: `Venta fiada ${v.folio}`,
    detalle: `Capturada por ${v.capturo} · ${v.dia}`,
    monto: v.monto,
  }));
  const abonos: Movimiento[] = c.abonos.map((a) => {
    const hasta = e.hasta[a.id];
    return {
      fecha: a.fecha,
      tipo: 'abono',
      titulo: `Abono de ${formatMoney(a.monto)}`,
      detalle: `Recibido ${a.dia} en ${a.metodo.toLowerCase()}${hasta ? ` · se aplicó hasta ${hasta}` : ''}`,
      monto: a.monto,
    };
  });
  return [...ventas, ...abonos].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function limiteNota(c: CuentaCliente, e: EstadoCuenta, dueno: string): string {
  const limite = formatMoney(c.limite);
  return e.saldo > c.limite
    ? `Pasó su límite de ${limite}. No le fíes más hasta que abone; si insiste, que hable con ${dueno}.`
    : `Puede fiar hasta ${limite} con plazo de ${c.plazo}. El límite y el plazo los define ${dueno} en el portal.`;
}

export function recordatorio(c: CuentaCliente, e: EstadoCuenta, negocio: string): string {
  return e.saldo > 0n
    ? `Hola ${c.nombre}, le recuerdo que tiene ${formatMoney(e.saldo)} pendiente en ${negocio}. Puede abonar en efectivo, transferencia o tarjeta cuando pase. ¡Gracias!`
    : `Hola ${c.nombre}, su cuenta en ${negocio} está al día. ¡Gracias!`;
}

/** The abono modal's preview: «V-0288 parcial · …» (folios only here) and what is left. */
export function vista(e: EstadoCuenta, monto: Money): { texto: string; restante: Money } {
  const a = aplicarAbono(
    e.ventas.map((v, i) => ({
      id: v.id,
      fecha: String(i).padStart(4, '0'),
      pendiente: v.pendiente,
    })),
    monto,
  );
  return {
    texto: a.aplicaciones
      .map((x) => `${x.ventaId} ${x.completa ? 'completa' : 'parcial'}`)
      .join(' · '),
    restante: a.restante,
  };
}

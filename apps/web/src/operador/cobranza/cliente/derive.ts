import {
  disponible,
  estadoDeCuenta,
  formatMoney,
  type EstadoCuenta,
  type Money,
} from '@xangarro/domain';

import { diasEntre, sumarDias, textoVence } from '../../ui/frases';
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

export interface Vence {
  readonly texto: string;
  readonly vencido: boolean;
}

/** «Se venció hace 2 días» (red), «Vence el viernes»: a ticket's due date: its day plus the client's plazo («15 días»), said against `hoy`. */
export function vence(fecha: string, plazo: string, hoy: string): Vence {
  const due = sumarDias(fecha.slice(0, 10), Number.parseInt(plazo, 10) || 0);
  const dif = diasEntre(hoy, due);
  if (dif < -1) return { texto: `Se venció hace ${-dif} días`, vencido: true };
  if (dif === -1) return { texto: 'Se venció ayer', vencido: true };
  return { texto: textoVence(hoy, due), vencido: false };
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

/**
 * Where each abono landed, in the order they were received: «V-0288 completa y
 * V-0310 en parte», plus what was left over as saldo a favor.
 */
function destinos(c: CuentaCliente): ReadonlyMap<string, string> {
  const tickets = [...c.ventas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const pend = tickets.map((v) => v.monto);
  const out = new Map<string, string>();
  for (const a of [...c.abonos].sort((x, y) => x.fecha.localeCompare(y.fecha))) {
    const tocadas: string[] = [];
    let resto = a.monto;
    tickets.forEach((v, i) => {
      const p = pend[i] ?? 0n;
      if (resto <= 0n || p <= 0n) return;
      const toma = resto < p ? resto : p;
      pend[i] = p - toma;
      resto -= toma;
      tocadas.push(`${v.folio} ${pend[i] === 0n ? 'completa' : 'en parte'}`);
    });
    const destino = tocadas.length ? ` · se aplicó a ${tocadas.join(' y ')}` : '';
    const favor = resto > 0n ? ` · ${formatMoney(resto)} quedó a su favor` : '';
    out.set(a.id, `${destino}${favor}`);
  }
  return out;
}

/** Tickets and abonos, newest first; each abono says which tickets it reached. */
export function historial(c: CuentaCliente): readonly Movimiento[] {
  const destino = destinos(c);
  const ventas: Movimiento[] = c.ventas.map((v) => ({
    fecha: v.fecha,
    tipo: 'fiado',
    titulo: `Venta fiada ${v.folio}`,
    detalle: `Capturada por ${v.capturo} · ${v.dia}`,
    monto: v.monto,
  }));
  const abonos: Movimiento[] = c.abonos.map((a) => ({
    fecha: a.fecha,
    tipo: 'abono',
    titulo: `Abono de ${formatMoney(a.monto)}`,
    detalle: `Recibido ${a.dia} en ${a.metodo.toLowerCase()}${destino.get(a.id) ?? ''}`,
    monto: a.monto,
  }));
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

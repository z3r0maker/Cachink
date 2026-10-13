/**
 * A register's credit account (`CuentaPara`, the read the web Worker and the
 * phone both build with `cuentaPara`) as the screens read it
 * (`CuentaCliente`): initials, tint, the short days, the method an abono is
 * said with, and `atrasado` derived from the facts and the client's plazo.
 * Moved from the web caja's `cobranza/vivo.ts` so the phone says the same
 * (ADR-118). Pure.
 */

import { colors } from '@xangarro/tokens';

import type { CuentaPara } from '../lectura/shapes';
import { comoMetodo } from '../ventas/derive';
import { abiertas, estadoCuenta, vence } from './cliente/derive';
import type { AbonoCuenta, CuentaCliente, VentaCuenta } from './cliente/types';

export type { CuentaCliente } from './cliente/types';
import type { MetodoAbono } from './types';

const TINTES = [colors.yellow, colors.blue, colors.green, colors.purple, colors.cyan] as const;

/** «Taller de Chuy» → «TD». */
export function inicialesDe(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

/** «hoy», or «6 may» — the short day the account lists use. */
export function diaCorto(fecha: string, hoy: string): string {
  const dia = fecha.slice(0, 10);
  if (dia === hoy) return 'hoy';
  const d = new Date(`${dia}T12:00:00`);
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(d);
}

function comoVenta(v: CuentaPara['ventas'][number], hoy: string): VentaCuenta {
  return {
    folio: `V-${String(v.folio).padStart(4, '0')}`,
    concepto: v.concepto,
    fecha: v.fecha,
    dia: diaCorto(v.fecha, hoy),
    monto: BigInt(v.montoCentavos),
    capturo: v.capturo,
  };
}

/**
 * The wire's method as an abono's. An abono taken before ADR-108 may read back
 * as «QR/CoDi»: CoDi is a bank transfer, so the screens say «Transferencia».
 */
export function metodoAbonoDe(metodo: string): MetodoAbono {
  const m = comoMetodo(metodo);
  return m === 'Efectivo' || m === 'Tarjeta' ? m : 'Transferencia';
}

function comoAbono(a: CuentaPara['abonos'][number], hoy: string): AbonoCuenta {
  return {
    id: a.id,
    fecha: a.fecha,
    dia: diaCorto(a.fecha, hoy),
    monto: BigInt(a.montoCentavos),
    metodo: metodoAbonoDe(a.metodo),
    ...(a.nota === null ? {} : { nota: a.nota }),
  };
}

/** A register's account as the screens read it; `atrasado` derives from the facts. */
export function comoCuenta(c: CuentaPara, hoy: string): CuentaCliente {
  const plazo = c.plazoDias === null ? '' : `${c.plazoDias} días`;
  const base: CuentaCliente = {
    id: c.id,
    nombre: c.nombre,
    iniciales: inicialesDe(c.nombre),
    telefono: c.telefono ?? '',
    tint: TINTES[[...c.nombre].length % TINTES.length] ?? colors.yellow,
    desde: new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(
      new Date(c.creado),
    ),
    limite: BigInt(c.limiteCentavos ?? '0'),
    plazo,
    atrasado: false,
    ventas: c.ventas.map((v) => comoVenta(v, hoy)),
    abonos: c.abonos.map((a) => comoAbono(a, hoy)),
  };
  const vencida = (v: VentaCuenta) => vence(v.fecha, plazo, hoy).vencido;
  return {
    ...base,
    atrasado:
      c.plazoDias !== null && abiertas(base, estadoCuenta(base)).some((a) => vencida(a.venta)),
  };
}

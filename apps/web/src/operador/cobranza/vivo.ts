'use client';

/**
 * The linked register's credit accounts (O-33): mapping the Worker's accounts
 * to the screen's `CuentaCliente`, the today label, and the abono write
 * through the real use case — shared by Cobranza and Detalle de cliente.
 */

import { colors } from '@xangarro/tokens';

import { registerRuntime } from '../runtime/client';
import { desencolar } from '../shell/cola';
import type { Credenciales } from '../runtime/use-credenciales';
import type { CuentaPara } from '../runtime/protocol';
import { abiertas, estadoCuenta, vence } from './cliente/derive';
import type { AbonoCuenta, CuentaCliente, VentaCuenta } from './cliente/types';
import type { MetodoAbono } from './types';

const TINTES = [colors.yellow, colors.blue, colors.green, colors.purple, colors.cyan] as const;
const dos = (n: number) => String(n).padStart(2, '0');

/** The register's local date — «hoy» for the account screens. */
export function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

function iniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

/** «hoy», or «6 may» — the short day the account lists use. */
function diaDe(fecha: string, hoy: string): string {
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
    dia: diaDe(v.fecha, hoy),
    monto: BigInt(v.montoCentavos),
    capturo: v.capturo,
  };
}

function comoAbono(a: CuentaPara['abonos'][number], hoy: string): AbonoCuenta {
  return {
    id: a.id,
    fecha: a.fecha,
    dia: diaDe(a.fecha, hoy),
    monto: BigInt(a.montoCentavos),
    metodo: a.metodo as MetodoAbono,
    ...(a.nota === null ? {} : { nota: a.nota }),
  };
}

/** A Worker account as the screens read it; `atrasado` derives from the facts. */
export function comoCuenta(c: CuentaPara, hoy: string): CuentaCliente {
  const plazo = c.plazoDias === null ? '' : `${c.plazoDias} días`;
  const base: CuentaCliente = {
    id: c.id,
    nombre: c.nombre,
    iniciales: iniciales(c.nombre),
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

/** Read the business's accounts from the register's own database. */
export async function leerCuentas(cred: Credenciales): Promise<readonly CuentaPara[]> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  return registerRuntime().cuentas(device.businessId, device.deviceId);
}

/** Record an abono through the use case; the queue carries it up (O-33). */
export async function abonarEnVivo(
  cred: Credenciales,
  clienteId: string,
  metodo: MetodoAbono,
  monto: bigint,
  hoy: string,
): Promise<void> {
  const { device } = cred;
  if (device === null) throw new Error('sin sesión');
  await registerRuntime().abonar({
    businessId: device.businessId,
    deviceId: device.deviceId,
    clienteId,
    montoCentavos: monto,
    metodo,
    fecha: hoy,
  });
  if (navigator.onLine) await desencolar();
}

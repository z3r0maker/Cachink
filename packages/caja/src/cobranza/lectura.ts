/**
 * The phone's reader shape for a credit account (M-08): the device's rows —
 * the Client, their fiado tickets with each header's line total, and their
 * abonos — said as the screen's `CuentaCliente`, the same mapping the web's
 * linked register performs (`operador/cobranza/vivo.ts`). Pure: the reader in
 * `packages/ui` gathers the rows; this only derives, so both surfaces that
 * read a local database show the same account.
 */
import { colors } from '@xangarro/tokens';
import type { Money } from '@xangarro/domain';

import { comoMetodo } from '../ventas/derive';
import { abiertas, estadoCuenta, vence } from './cliente/derive';
import type { AbonoCuenta, CuentaCliente, VentaCuenta } from './cliente/types';
import type { MetodoAbono } from './types';

/** One fiado ticket as the phone reads it: the Ticket header plus its lines' total. */
export interface FilaVentaCuenta {
  readonly folio: number;
  readonly concepto: string;
  /** The ticket's day, "YYYY-MM-DD". */
  readonly fecha: string;
  /** "HH:MM" at capture, null for migrated rows. */
  readonly hora: string | null;
  readonly monto: Money;
  /** Said by the reader («Ana Robledo · Caja 1»). */
  readonly capturo: string;
}

/** One abono as the phone reads it: a ClientPayment row. */
export interface FilaAbonoCuenta {
  readonly id: string;
  /** IsoDate — abonos are day-granular. */
  readonly fecha: string;
  readonly monto: Money;
  /** A domain `PaymentMethod`; «QR/CoDi» reads «Transferencia» (ADR-108). */
  readonly metodo: string;
  readonly nota: string | null;
}

/** A client's account as the phone reads it: the Client row plus its two facts. */
export interface FilaCuenta {
  readonly id: string;
  readonly nombre: string;
  readonly telefono: string | null;
  /** ISO timestamp of when the client was created. */
  readonly creado: string;
  /** The owner-set credit line; null when none was studied. */
  readonly limite: Money | null;
  readonly plazoDias: number | null;
  readonly ventas: readonly FilaVentaCuenta[];
  readonly abonos: readonly FilaAbonoCuenta[];
}

/** The avatar tints the cards cycle through, as the web's register does. */
const TINTES = [colors.yellow, colors.blue, colors.green, colors.purple, colors.cyan] as const;

/** «Doña Mari de la tienda» → «DM»; one name gives its first letter. */
export function inicialesCliente(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

/** «hoy», or «6 may» — the short day the account lists use. */
export function diaCuenta(fecha: string, hoy: string): string {
  const dia = fecha.slice(0, 10);
  if (dia === hoy) return 'hoy';
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(
    new Date(`${dia}T12:00:00`),
  );
}

/** The wire's method as an abono's: QR/CoDi was a bank transfer (ADR-108). */
export function metodoAbonoDe(metodo: string): MetodoAbono {
  const m = comoMetodo(metodo);
  return m === 'Efectivo' || m === 'Tarjeta' ? m : 'Transferencia';
}

function comoVenta(v: FilaVentaCuenta, hoy: string): VentaCuenta {
  return {
    folio: `V-${String(v.folio).padStart(4, '0')}`,
    concepto: v.concepto,
    fecha: `${v.fecha}T${v.hora ?? '00:00'}`,
    dia: diaCuenta(v.fecha, hoy),
    monto: v.monto,
    capturo: v.capturo,
  };
}

function comoAbono(a: FilaAbonoCuenta, hoy: string): AbonoCuenta {
  return {
    id: a.id,
    fecha: a.fecha,
    dia: diaCuenta(a.fecha, hoy),
    monto: a.monto,
    metodo: metodoAbonoDe(a.metodo),
    ...(a.nota === null ? {} : { nota: a.nota }),
  };
}

/** A device's rows as the screens read the account; `atrasado` derives from the facts. */
export function comoCuenta(f: FilaCuenta, hoy: string): CuentaCliente {
  const plazo = f.plazoDias === null ? '' : `${f.plazoDias} días`;
  const base: CuentaCliente = {
    id: f.id,
    nombre: f.nombre,
    iniciales: inicialesCliente(f.nombre),
    telefono: f.telefono ?? '',
    tint: TINTES[[...f.nombre].length % TINTES.length] ?? colors.yellow,
    desde: new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(
      new Date(f.creado),
    ),
    limite: f.limite ?? 0n,
    plazo,
    atrasado: false,
    ventas: f.ventas.map((v) => comoVenta(v, hoy)),
    abonos: f.abonos.map((a) => comoAbono(a, hoy)),
  };
  const vencida = (v: VentaCuenta) => vence(v.fecha, plazo, hoy).vencido;
  return {
    ...base,
    atrasado:
      f.plazoDias !== null && abiertas(base, estadoCuenta(base)).some((a) => vencida(a.venta)),
  };
}

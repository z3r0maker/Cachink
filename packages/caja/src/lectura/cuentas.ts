/**
 * A client's credit account as the caja reads it (O-33, ADR-074): its only
 * two facts, the fiado tickets and the abonos, with the domain's derived
 * saldo. The web Worker (`runtime/cuentas.ts`) and the phone read the rows
 * from their own `@xangarro/data` repositories and assemble them here, so
 * both say the same saldo. Pure.
 */

import { estadoDeCuenta, type Money } from '@xangarro/domain';

import type { AbonoCuentaPara, CuentaPara, VentaCuentaPara } from './shapes';

export interface ClienteCuentaFila {
  readonly id: string;
  readonly nombre: string;
  readonly telefono: string | null;
  readonly createdAt: string;
  readonly limiteCentavos: bigint | null;
  readonly plazoDias: number | null;
}

/** A Crédito ticket's header; its amount is its lines' (`totalDeLineas`). */
export interface TicketCuentaFila {
  readonly id: string;
  readonly folio: number;
  readonly concepto: string;
  readonly fecha: string;
  readonly hora: string | null;
  readonly createdByUserId: string | null;
}

export interface AbonoCuentaFila {
  readonly id: string;
  readonly fecha: string;
  readonly montoCentavos: bigint;
  readonly metodo: string;
  readonly nota: string | null;
}

export interface FilasCuenta {
  readonly cliente: ClienteCuentaFila;
  readonly ventas: readonly TicketCuentaFila[];
  /** Each ticket's total by ticket id. */
  readonly montos: ReadonlyMap<string, bigint>;
  readonly abonos: readonly AbonoCuentaFila[];
  /** «Ana Robledo · Caja 1» by ticket id (`capturoDe`). */
  readonly capturos: ReadonlyMap<string, string>;
}

/** A ticket's amount is what its lines say; the header carries no total. */
export const totalDeLineas = (lineas: readonly { readonly monto: bigint }[]): bigint =>
  lineas.reduce((acc, l) => acc + l.monto, 0n);

/** «Ana Robledo · Caja 1» — who captured the ticket; «Caja 1» with no user. */
export function capturoDe(userId: string | null, nombre: string | null | undefined): string {
  if (userId === null) return 'Caja 1';
  return `${nombre ?? 'Caja 1'} · Caja 1`;
}

/** The domain's saldo over the two facts (ADR-074). */
export function saldoDeFilas(
  ventas: readonly { readonly id: string; readonly fecha: string }[],
  montos: ReadonlyMap<string, bigint>,
  abonos: readonly AbonoCuentaFila[],
): Money {
  return estadoDeCuenta(
    ventas.map((t) => ({ id: t.id, fecha: t.fecha, monto: montos.get(t.id) ?? 0n })),
    abonos.map((a) => ({ id: a.id, fecha: a.fecha, monto: a.montoCentavos })),
  ).saldo;
}

function comoVentaPara(
  t: TicketCuentaFila,
  montos: ReadonlyMap<string, bigint>,
  capturos: ReadonlyMap<string, string>,
): VentaCuentaPara {
  return {
    folio: t.folio,
    concepto: t.concepto,
    fecha: `${t.fecha}T${t.hora ?? '00:00'}`,
    montoCentavos: (montos.get(t.id) ?? 0n).toString(),
    capturo: capturos.get(t.id) ?? 'Caja 1',
  };
}

const comoAbonoPara = (a: AbonoCuentaFila): AbonoCuentaPara => ({
  id: a.id,
  fecha: a.fecha,
  montoCentavos: a.montoCentavos.toString(),
  metodo: a.metodo,
  nota: a.nota,
});

/** One client's account: fiado history, abonos, and the derived saldo. */
export function cuentaPara(f: FilasCuenta): CuentaPara {
  const c = f.cliente;
  return {
    id: c.id,
    nombre: c.nombre,
    telefono: c.telefono,
    creado: c.createdAt,
    limiteCentavos: c.limiteCentavos?.toString() ?? null,
    plazoDias: c.plazoDias,
    saldoCentavos: saldoDeFilas(f.ventas, f.montos, f.abonos).toString(),
    ventas: f.ventas.map((t) => comoVentaPara(t, f.montos, f.capturos)),
    abonos: f.abonos.map(comoAbonoPara),
  };
}

/** Fiado still owed across the business: the total and how many clients owe. */
export function porCobrarDe(cuentas: readonly CuentaPara[]): {
  readonly monto: bigint;
  readonly clientes: number;
} {
  const saldos = cuentas.map((c) => BigInt(c.saldoCentavos)).filter((s) => s > 0n);
  return { monto: saldos.reduce((a, b) => a + b, 0n), clientes: saldos.length };
}

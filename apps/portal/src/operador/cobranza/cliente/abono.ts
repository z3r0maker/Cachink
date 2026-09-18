import { aplicarAbono, formatMoney, type EstadoCuenta, type Money } from '@xangarro/domain';

import type { MetodoAbono } from '../types';
import type { AbonoCuenta, CuentaCliente } from './types';

const dos = (n: number) => String(n).padStart(2, '0');

/**
 * An abono taken now; the whole amount is recorded (D5: an excess is saldo a
 * favor). `hoy` is the turno's date (the fixtures' frozen 14 May until O-06).
 */
export function nuevoAbono(
  metodo: MetodoAbono,
  monto: Money,
  ahora: Date,
  hoy?: string,
): AbonoCuenta {
  const hora = `${dos(ahora.getHours())}:${dos(ahora.getMinutes())}`;
  const dia = hoy ?? `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
  return {
    id: `ab-${ahora.getTime()}`,
    fecha: `${dia}T${hora}`,
    dia: `hoy ${hora}`,
    monto,
    metodo,
  };
}

export interface VistaAbono {
  readonly texto: string;
  readonly restante: Money;
  readonly aplicado: Money;
  readonly aFavor: Money;
}

/**
 * Where an amount would land, oldest ticket first (domain `aplicarAbono`).
 * Cobranza names each ticket with its day, Detalle de cliente by folio only.
 */
export function vistaAbono(
  c: CuentaCliente,
  e: EstadoCuenta,
  monto: Money,
  conDia: boolean,
): VistaAbono {
  const a = aplicarAbono(
    e.ventas.map((v, i) => ({
      id: v.id,
      fecha: String(i).padStart(4, '0'),
      pendiente: v.pendiente,
    })),
    monto,
  );
  const dia = (folio: string) =>
    conDia ? ` · ${c.ventas.find((v) => v.folio === folio)?.dia ?? ''}` : '';
  const partes = a.aplicaciones.map(
    (x) => `${x.ventaId}${dia(x.ventaId)} ${x.completa ? 'completa' : 'parcial'}`,
  );
  if (a.excedente > 0n) partes.push(`${formatMoney(a.excedente)} a su favor`);
  return {
    texto: partes.join(' · '),
    restante: a.restante,
    aplicado: a.aplicado,
    aFavor: a.excedente,
  };
}

/** The toast after an abono; Cobranza names the client, the detail screen does not. */
export function toastAbono(
  v: VistaAbono,
  monto: Money,
  metodo: MetodoAbono,
  nombre?: string,
): string {
  const quien = nombre ? ` de ${nombre}` : '';
  const favor = v.aFavor > 0n ? ` ${formatMoney(v.aFavor)} quedan a su favor.` : '';
  return `${formatMoney(monto)}${quien} por ${metodo.toLowerCase()}. Se aplicó a lo más antiguo; queda ${formatMoney(v.restante)}.${favor}`;
}

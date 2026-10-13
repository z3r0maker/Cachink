/**
 * The abono being taken (`useAbono`): the amount as typed, how it is paid,
 * and where it would land — the domain's allocation over the account's open
 * tickets, oldest first. The same rules the web's modal applies: nothing is
 * an amount until `parseRecibido` says so and it is above zero.
 */
import { useState } from 'react';
import { parseRecibido } from '@xangarro/caja/caja';
import {
  estadoCuenta,
  vistaAbono,
  type CuentaCliente,
  type MetodoAbono,
} from '@xangarro/caja/cobranza';

/** The amount being typed, the method, and where it would land. */
export function useAbono(c: CuentaCliente) {
  const [raw, setRaw] = useState('');
  const [metodo, setMetodo] = useState<MetodoAbono>('Efectivo');
  const parsed = parseRecibido(raw);
  const monto = parsed !== null && parsed > 0n ? parsed : null;
  const e = estadoCuenta(c);
  const vista = monto === null ? null : vistaAbono(c, e, monto, false);
  return { raw, setRaw, metodo, setMetodo, monto, vista, saldo: e.saldo };
}

export type AbonoForma = ReturnType<typeof useAbono>;

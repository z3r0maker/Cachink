'use client';

import { useCallback, useMemo, useState } from 'react';
import { formatMoney, type Money } from '@xangarro/domain';

import type { MetodoAbono } from '../types';
import { estadoCuenta } from './derive';
import type { CuentaCliente } from './types';

const dos = (n: number) => String(n).padStart(2, '0');

/**
 * The account and its modals. An abono is appended to the account's abonos —
 * the only write; balance and history re-derive (README §10). Device-local
 * until the use case is wired (O-06).
 */
export function useCliente(inicial: CuentaCliente) {
  const [cuenta, setCuenta] = useState(inicial);
  const [modal, setModal] = useState<'abono' | 'recordar' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const e = useMemo(() => estadoCuenta(cuenta), [cuenta]);
  const registrar = (metodo: MetodoAbono, monto: Money) => {
    const aplicado = monto < e.saldo ? monto : e.saldo;
    const d = new Date();
    const hora = `${dos(d.getHours())}:${dos(d.getMinutes())}`;
    const fecha = `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${hora}`;
    const abono = { id: `ab-${d.getTime()}`, fecha, dia: `hoy ${hora}`, monto: aplicado, metodo };
    setCuenta((c) => ({ ...c, abonos: [...c.abonos, abono] }));
    setToast(
      `${formatMoney(aplicado)} por ${metodo.toLowerCase()}. Se aplicó a lo más antiguo; queda ${formatMoney(e.saldo - aplicado)}.`,
    );
    setModal(null);
  };
  const closeToast = useCallback(() => setToast(null), []);
  return { cuenta, e, modal, setModal, registrar, toast, closeToast };
}

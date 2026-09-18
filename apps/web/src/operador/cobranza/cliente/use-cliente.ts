'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Money } from '@xangarro/domain';

import type { MetodoAbono } from '../types';
import { nuevoAbono, toastAbono, vistaAbono } from './abono';
import { estadoCuenta } from './derive';
import type { CuentaCliente } from './types';

/**
 * The account and its modals. An abono is appended to the account's abonos, whole —
 * the only write; balance and history re-derive (README §10). Device-local
 * until the use case is wired (O-06).
 */
export function useCliente(inicial: CuentaCliente) {
  const [cuenta, setCuenta] = useState(inicial);
  const [modal, setModal] = useState<'abono' | 'recordar' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const e = useMemo(() => estadoCuenta(cuenta), [cuenta]);
  const registrar = (metodo: MetodoAbono, monto: Money) => {
    const v = vistaAbono(cuenta, e, monto, false);
    setCuenta((c) => ({ ...c, abonos: [...c.abonos, nuevoAbono(metodo, monto, new Date())] }));
    setToast(toastAbono(v, monto, metodo));
    setModal(null);
  };
  const closeToast = useCallback(() => setToast(null), []);
  return { cuenta, e, modal, setModal, registrar, toast, closeToast };
}

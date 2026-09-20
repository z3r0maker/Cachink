'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Money } from '@xangarro/domain';

import { useCredenciales } from '../../runtime/use-credenciales';
import { abonarEnVivo, hoyLocal } from '../vivo';
import type { MetodoAbono } from '../types';
import { nuevoAbono, toastAbono, vistaAbono } from './abono';
import { estadoCuenta } from './derive';
import type { CuentaCliente } from './types';

/**
 * The account and its modals. An abono is appended to the account's abonos, whole —
 * the only write; balance and history re-derive (README §10). On a linked
 * register (O-33) the append is optimistic and the write goes through the use
 * case, queue and all.
 */
export function useCliente(inicial: CuentaCliente, vinculado = false) {
  const [cuenta, setCuenta] = useState(inicial);
  const [modal, setModal] = useState<'abono' | 'recordar' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const cred = useCredenciales();
  const e = useMemo(() => estadoCuenta(cuenta), [cuenta]);
  const registrar = (metodo: MetodoAbono, monto: Money) => {
    const v = vistaAbono(cuenta, e, monto, false);
    setCuenta((c) => ({ ...c, abonos: [...c.abonos, nuevoAbono(metodo, monto, new Date())] }));
    setToast(toastAbono(v, monto, metodo));
    setModal(null);
    if (vinculado) {
      void abonarEnVivo(cred, cuenta.id, metodo, monto, hoyLocal()).catch((err: unknown) =>
        setToast(`No se pudo registrar el abono: ${String(err)}`),
      );
    }
  };
  const closeToast = useCallback(() => setToast(null), []);
  return { cuenta, e, modal, setModal, registrar, toast, closeToast };
}

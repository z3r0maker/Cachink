'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Money } from '@xangarro/domain';

import { useCredenciales, type Credenciales } from '../runtime/use-credenciales';
import { abonarEnVivo, comoCuenta, hoyLocal, leerCuentas } from './vivo';
import { nuevoAbono, toastAbono, vistaAbono } from './cliente/abono';
import { estadoCuenta } from './cliente/derive';
import type { CuentaCliente } from './cliente/types';
import type { CobranzaData, FiltroCobranza, MetodoAbono } from './types';

/**
 * The accounts, filters, the open abono and the toast. An abono is appended to
 * the account, whole; balances and today's list re-derive. On a linked
 * register (O-33) the accounts come from its database and the abono goes
 * through the real use case — appended optimistically, then carried up.
 */
export function useCobranza(data: CobranzaData) {
  const cred = useCredenciales();
  const linked = cred.device !== null && cred.sesion !== null;
  const [cuentas, setCuentas] = useState<readonly CuentaCliente[]>(data.cuentas);
  const [filtro, setFiltro] = useState<FiltroCobranza>('Todos');
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  useCargaViva(cred, linked, setCuentas);
  const hoy = linked ? hoyLocal() : data.hoy;
  const cliente = cuentas.find((c) => c.id === sel) ?? null;

  const registrar = (metodo: MetodoAbono, monto: Money) => {
    if (!cliente) return;
    const o = optimista(cliente, metodo, monto, hoy);
    setCuentas((all) => all.map((c) => (c.id === cliente.id ? o.cuenta : c)));
    setToast(o.toast);
    setSel(null);
    if (linked) {
      void abonarEnVivo(cred, cliente.id, metodo, monto, hoy).catch((e: unknown) =>
        setToast(`No se pudo registrar el abono: ${String(e)}`),
      );
    }
  };
  const closeToast = useCallback(() => setToast(null), []);
  return {
    cuentas,
    hoy,
    filtro,
    setFiltro,
    query,
    setQuery,
    cliente,
    setSel,
    registrar,
    toast,
    closeToast,
  };
}

/** The optimistic append: same shape the fixture path always used. */
function optimista(
  cliente: CuentaCliente,
  metodo: MetodoAbono,
  monto: Money,
  hoy: string,
): { readonly cuenta: CuentaCliente; readonly toast: string } {
  const v = vistaAbono(cliente, estadoCuenta(cliente), monto, true);
  return {
    cuenta: {
      ...cliente,
      abonos: [...cliente.abonos, nuevoAbono(metodo, monto, new Date(), hoy)],
    },
    toast: toastAbono(v, monto, metodo, cliente.nombre),
  };
}

/** A linked register starts from its own accounts — never the fixture's debts. */
function useCargaViva(
  cred: Credenciales,
  linked: boolean,
  setCuentas: React.Dispatch<React.SetStateAction<readonly CuentaCliente[]>>,
): void {
  useEffect(() => {
    if (!linked) return;
    void leerCuentas(cred)
      .then((rows) => setCuentas(rows.map((c) => comoCuenta(c, hoyLocal()))))
      .catch((e: unknown) => console.error('cuentas', e));
  }, [cred, linked, setCuentas]);
}

export type Cobranza = ReturnType<typeof useCobranza>;

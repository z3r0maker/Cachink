'use client';

import { useCallback, useState } from 'react';
import type { Money } from '@xangarro/domain';

import { nuevoAbono, toastAbono, vistaAbono } from './cliente/abono';
import { estadoCuenta } from './cliente/derive';
import type { CobranzaData, FiltroCobranza, MetodoAbono } from './types';

/**
 * The accounts, filters, the open abono and the toast. An abono is appended to
 * the account, whole; balances and today's list re-derive. Device-local until
 * the use case is wired (O-06).
 */
export function useCobranza(data: CobranzaData) {
  const [cuentas, setCuentas] = useState(data.cuentas);
  const [filtro, setFiltro] = useState<FiltroCobranza>('Todos');
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const cliente = cuentas.find((c) => c.id === sel) ?? null;
  const registrar = (metodo: MetodoAbono, monto: Money) => {
    if (!cliente) return;
    const v = vistaAbono(cliente, estadoCuenta(cliente), monto, true);
    const abono = nuevoAbono(metodo, monto, new Date(), data.hoy);
    setCuentas((all) =>
      all.map((c) => (c.id === cliente.id ? { ...c, abonos: [...c.abonos, abono] } : c)),
    );
    setToast(toastAbono(v, monto, metodo, cliente.nombre));
    setSel(null);
  };
  const closeToast = useCallback(() => setToast(null), []);
  return {
    cuentas,
    hoy: data.hoy,
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

export type Cobranza = ReturnType<typeof useCobranza>;

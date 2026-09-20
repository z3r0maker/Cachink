'use client';

import { useCallback, useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import type { NuevoGasto } from './registrar';
import type { CategoriaGasto, GastoTurno } from './types';

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * The list, its filters, the form and the toast. A new expense goes on top of
 * this device's list until the capture use case is wired (O-06).
 */
export function useGastos(inicial: readonly GastoTurno[], registrarVivo?: (n: NuevoGasto) => void) {
  const [gastos, setGastos] = useState(inicial);
  const [filtro, setFiltro] = useState<'Todos' | CategoriaGasto>('Todos');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const registrar = (n: NuevoGasto) => {
    const nuevo: GastoTurno = {
      id: `g-${Date.now()}`,
      concepto: n.concepto,
      detalle: n.foto ? 'Con foto' : 'Sin comprobante',
      monto: n.monto,
      categoria: n.categoria,
      hora: hhmm(new Date()),
      comprobante: n.foto !== null,
    };
    setGastos((all) => [nuevo, ...all]);
    const prueba = n.foto ? 'con comprobante' : 'sin comprobante';
    setToast(`−${formatMoney(n.monto)} · ${n.concepto} · ${n.categoria} · ${prueba}.`);
    setOpen(false);
    // Linked (O-35): the optimistic row stands in for the use case's write.
    registrarVivo?.(n);
  };
  const closeToast = useCallback(() => setToast(null), []);
  return {
    gastos,
    filtro,
    setFiltro,
    query,
    setQuery,
    open,
    setOpen,
    toast,
    registrar,
    closeToast,
  };
}

export type Gastos = ReturnType<typeof useGastos>;

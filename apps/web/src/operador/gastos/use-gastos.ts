'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import type { NuevoGasto, PrefillGasto, CategoriaGasto, GastoTurno } from '@xangarro/caja/gastos';

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** «Gas Express · con foto», or just «Sin comprobante» when nobody was named. */
function detalleDe(n: NuevoGasto): string {
  const prueba = n.foto ? 'con foto' : 'sin comprobante';
  if (n.proveedor === null) return prueba.charAt(0).toUpperCase() + prueba.slice(1);
  return `${n.proveedor} · ${prueba}`;
}

/** The row a new gasto shows until the live read hands it back. */
const optimista = (n: NuevoGasto): GastoTurno => ({
  id: `g-${Date.now()}`,
  concepto: n.concepto,
  detalle: detalleDe(n),
  monto: n.monto,
  categoria: n.categoria,
  hora: hhmm(new Date()),
  comprobante: n.foto !== null,
});

/**
 * The drawer: a due recurring gasto to pay opens it filled; once closed, the
 * «Registrar gasto» button opens an empty one again.
 */
function useCajon(prefill: PrefillGasto | null) {
  const [open, setOpen] = useState(false);
  const [pendiente, setPendiente] = useState<PrefillGasto | null>(null);
  useEffect(() => {
    if (prefill === null) return;
    setPendiente(prefill);
    setOpen(true);
  }, [prefill]);
  const abrir = useCallback((o: boolean) => {
    setOpen(o);
    if (!o) setPendiente(null);
  }, []);
  return { open, abrir, pendiente };
}

/**
 * The list, its filters, the form and the toast. A new expense goes on top of
 * this device's list until the capture use case is wired (O-06).
 */
export function useGastos(
  inicial: readonly GastoTurno[],
  registrarVivo?: (n: NuevoGasto) => void,
  prefill: PrefillGasto | null = null,
) {
  const [gastos, setGastos] = useState(inicial);
  // A (live) read hands back new rows: they replace the optimistic list.
  useEffect(() => setGastos(inicial), [inicial]);
  const [filtro, setFiltro] = useState<'Todos' | CategoriaGasto>('Todos');
  const [query, setQuery] = useState('');
  const { open, abrir, pendiente } = useCajon(prefill);
  const [toast, setToast] = useState<string | null>(null);
  const registrar = (n: NuevoGasto) => {
    setGastos((all) => [optimista(n), ...all]);
    const prueba = n.foto ? 'con comprobante' : 'sin comprobante';
    setToast(`−${formatMoney(n.monto)} · ${n.concepto} · ${n.categoria} · ${prueba}.`);
    abrir(false);
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
    setOpen: abrir,
    prefill: pendiente,
    toast,
    registrar,
    closeToast,
  };
}

export type Gastos = ReturnType<typeof useGastos>;

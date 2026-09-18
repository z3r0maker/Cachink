'use client';

import { useCallback, useState } from 'react';
import type { Money } from '@xangarro/domain';

import { abonar, aplicar, aplicaTexto, toastAbono } from './derive';
import type { AbonoHoy, CobranzaData, FiltroCobranza, MetodoAbono } from './types';

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * Clients, today's abonos, filters, the open abono and the toast. An abono
 * settles tickets on this device until the use case is wired (O-06).
 */
export function useCobranza(data: CobranzaData) {
  const [clientes, setClientes] = useState(data.clientes);
  const [abonos, setAbonos] = useState(data.abonos);
  const [filtro, setFiltro] = useState<FiltroCobranza>('Todos');
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const cliente = clientes.find((c) => c.id === sel) ?? null;
  const registrar = (metodo: MetodoAbono, monto: Money) => {
    if (!cliente) return;
    const a = aplicar(cliente, monto);
    const nuevo: AbonoHoy = {
      id: `a-${Date.now()}`,
      clienteId: cliente.id,
      detalle: `${metodo} · se aplicó a ${aplicaTexto(cliente, a)}`,
      monto: a.aplicado,
      metodo,
      hora: hhmm(new Date()),
    };
    setClientes((all) => all.map((c) => (c.id === cliente.id ? abonar(c, a) : c)));
    setAbonos((all) => [nuevo, ...all]);
    setToast(toastAbono(cliente.nombre, metodo, a));
    setSel(null);
  };
  const closeToast = useCallback(() => setToast(null), []);
  return {
    clientes,
    abonos,
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

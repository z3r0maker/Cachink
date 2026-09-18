'use client';

import { useCallback, useState } from 'react';

import { aplicar } from './derive';
import type { NuevoMovimiento } from './mover';
import type { InventarioData, Movimiento, Pestana, TipoMovimiento } from './types';

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export interface Toast {
  readonly tipo: TipoMovimiento;
  readonly body: string;
}

/**
 * Stock, this turno's movements, the open form and the toast. A movement moves
 * the stock on this device until the use case is wired (O-06).
 */
export function useInventario(data: InventarioData, tabInicial: Pestana) {
  const [items, setItems] = useState(data.existencias);
  const [movs, setMovs] = useState(data.movimientos);
  const [tab, setTab] = useState(tabInicial);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<{ tipo: TipoMovimiento; inicial: string | null } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const registrar = (n: NuevoMovimiento) => {
    const m: Movimiento = { ...n, id: `m-${Date.now()}`, hora: hhmm(new Date()) };
    setItems((all) => aplicar(all, m));
    setMovs((all) => [...all, m]);
    const nombre = items.find((i) => i.id === n.existenciaId)?.nombre ?? '';
    const signo = n.tipo === 'Merma' ? '−' : '+';
    const motivo = n.tipo === 'Merma' ? ` · ${n.detalle}` : '';
    setToast({
      tipo: n.tipo,
      body: `${signo}${n.cantidad} de ${nombre}${motivo}. Queda en tu turno.`,
    });
    setForm(null);
  };
  const mover = (tipo: TipoMovimiento, inicial: string | null = null) => setForm({ tipo, inicial });
  const closeToast = useCallback(() => setToast(null), []);
  return {
    items,
    movs,
    tab,
    setTab,
    query,
    setQuery,
    form,
    setForm,
    mover,
    registrar,
    toast,
    closeToast,
  };
}

export type Inventario = ReturnType<typeof useInventario>;

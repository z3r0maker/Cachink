'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  aplicar,
  type InventarioData,
  type Movimiento,
  type NuevoMovimientoVivo,
  type Pestana,
  type TipoMovimiento,
} from '@xangarro/caja/inventario';
import type { NuevoMovimiento } from './mover';

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export interface Toast {
  readonly tipo: TipoMovimiento;
  readonly body: string;
}

/** «−3 de Carne de pastor · Se rompió. Queda en tu turno.» */
function toastDe(n: NuevoMovimiento, nombre: string): Toast {
  const signo = n.tipo === 'Merma' ? '−' : '+';
  const motivo = n.tipo === 'Merma' ? ` · ${n.detalle}` : '';
  return { tipo: n.tipo, body: `${signo}${n.cantidad} de ${nombre}${motivo}. Queda en tu turno.` };
}

/** Stock and movements, reset whenever a (live) read hands back new data. */
function useDatos(data: InventarioData) {
  const [items, setItems] = useState(data.existencias);
  const [movs, setMovs] = useState(data.movimientos);
  useEffect(() => {
    setItems(data.existencias);
    setMovs(data.movimientos);
  }, [data]);
  return { items, setItems, movs, setMovs };
}

/**
 * `?reponer=<id>` (Inicio's «Para hoy»): open that product's «Llegó
 * mercancía» once, as soon as it is in the list.
 */
function useReponer(
  reponer: string | null,
  items: readonly { readonly id: string }[],
  setForm: (f: { tipo: TipoMovimiento; id: string }) => void,
) {
  const [hecho, setHecho] = useState(false);
  useEffect(() => {
    if (hecho || reponer === null || !items.some((i) => i.id === reponer)) return;
    setHecho(true);
    setForm({ tipo: 'Entrada', id: reponer });
  }, [hecho, reponer, items, setForm]);
}

/**
 * Stock, this turno's movements, the open form and the toast. A movement moves
 * the stock on this device at once; on a linked caja it also goes through the
 * use case (`registrarVivo`), whose reload hands back fresh `data`.
 */
export function useInventario(
  data: InventarioData,
  tabInicial: Pestana,
  registrarVivo?: (m: NuevoMovimientoVivo) => void,
  reponer: string | null = null,
) {
  const { items, setItems, movs, setMovs } = useDatos(data);
  const [tab, setTab] = useState(tabInicial);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<{ tipo: TipoMovimiento; id: string } | null>(null);
  useReponer(reponer, items, setForm);
  const [toast, setToast] = useState<Toast | null>(null);
  const registrar = (n: NuevoMovimiento) => {
    const m: Movimiento = { ...n, id: `m-${Date.now()}`, hora: hhmm(new Date()) };
    setItems((all) => aplicar(all, m));
    setMovs((all) => [...all, m]);
    setToast(toastDe(n, items.find((i) => i.id === n.existenciaId)?.nombre ?? ''));
    setForm(null);
    registrarVivo?.(n);
  };
  const mover = (tipo: TipoMovimiento, id: string) => setForm({ tipo, id });
  const closeToast = useCallback(() => setToast(null), []);
  return {
    /** A linked caja records whole quantities only (the domain's integers). */
    enteros: registrarVivo !== undefined,
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

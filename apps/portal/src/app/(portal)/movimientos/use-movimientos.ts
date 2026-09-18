'use client';

import { enRango, type IsoDate, type Rango } from '@xangarro/domain';
import { useMemo, useState } from 'react';

import type { MovimientosData } from '@/server/screens';

import { rangoDe, type Personalizado, type RangoChip } from './periodo';

type Row = MovimientosData[number];

function filtrar(
  source: MovimientosData | null,
  rango: Rango,
  filter: string | null,
  query: string,
): readonly Row[] {
  if (source === null) return [];
  const q = query.trim().toLowerCase();
  return source.filter(
    (m) =>
      enRango(m.fecha, rango) &&
      (filter === null || m.clasificacion === filter) &&
      (q === '' || m.concepto.toLowerCase().includes(q)),
  );
}

/**
 * Every filter on Movimientos narrows the rows and the counters follow — the
 * range chip included (P-09: a chip that only highlights is a bug). Switching
 * tabs resets the category: the keys are not shared.
 */
export function useMovimientos(
  initialTab: string,
  hoy: IsoDate,
  ventas: MovimientosData | null,
  gastos: MovimientosData | null,
) {
  const [tab, setTab] = useState(initialTab);
  const [range, setRange] = useState<RangoChip>('mes');
  const [custom, setCustom] = useState<Personalizado>({ desde: '', hasta: '' });
  const [filter, setFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const source = tab === 'gastos' ? gastos : ventas;

  const rows = useMemo(
    () => filtrar(source, rangoDe(range, hoy, custom), filter, query),
    [source, range, hoy, custom, filter, query],
  );

  const chips = useMemo(
    () => [...new Set((source ?? []).map((m) => m.clasificacion))].sort(),
    [source],
  );
  const onTab = (v: string) => {
    setTab(v);
    setFilter(null);
  };
  return {
    tab,
    onTab,
    range,
    setRange,
    custom,
    setCustom,
    filter,
    setFilter,
    query,
    setQuery,
    source,
    rows,
    chips,
  };
}

export type Movimientos = ReturnType<typeof useMovimientos>;

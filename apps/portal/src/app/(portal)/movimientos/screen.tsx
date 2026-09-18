'use client';

import { useMemo, useState } from 'react';

import { DataTable, ScreenBody, SegmentedTabs } from '@/components';
import type { MovimientosData } from '@/server/screens';
import { resolveScreenState } from '@/session/gating';

import { COLUMNS, CategoryChips, Heading, SearchAndRange } from './parts';

export type TabKey = 'ventas' | 'gastos';

type Row = MovimientosData[number];

const RANGES = ['Hoy', 'Semana', 'Mayo 2026', 'Personalizado'];

export interface MovimientosScreenProps {
  readonly initialTab: TabKey;
  /** `null` when the read failed — the screen renders its error state. */
  readonly ventas: MovimientosData | null;
  readonly gastos: MovimientosData | null;
}

function Body({
  source,
  rows,
  tab,
}: {
  readonly source: MovimientosData | null;
  readonly rows: readonly Row[];
  readonly tab: string;
}) {
  return (
    <ScreenBody
      state={resolveScreenState({ error: source === null, isEmpty: rows.length === 0 })}
      onRetry={() => window.location.reload()}
      empty={{
        title: `Aún no hay ${tab === 'gastos' ? 'gastos' : 'ventas'} en este periodo`,
        body: 'Lo que registren tus operadores en el teléfono aparecerá aquí.',
      }}
    >
      <DataTable
        caption="Movimientos"
        columns={COLUMNS}
        rows={rows}
        rowKey={(m) => m.id}
        minWidth={820}
        footer={<span>Mostrando {rows.length} movimientos</span>}
      />
    </ScreenBody>
  );
}

function Filters({
  query,
  onQuery,
  range,
  onRange,
  chips,
  filter,
  onFilter,
}: {
  readonly query: string;
  readonly onQuery: (v: string) => void;
  readonly range: string;
  readonly onRange: (v: string) => void;
  readonly chips: readonly string[];
  readonly filter: string | null;
  readonly onFilter: (v: string | null) => void;
}) {
  return (
    <>
      <SearchAndRange
        query={query}
        onQuery={onQuery}
        range={range}
        onRange={onRange}
        ranges={RANGES}
      />
      <CategoryChips chips={chips} filter={filter} onFilter={onFilter} />
    </>
  );
}

/**
 * Filters must actually filter and the counters must follow — a chip that only
 * highlights is a bug (design handoff).
 */
function useFiltered(source: MovimientosData | null, filter: string | null, query: string) {
  const rows = useMemo(() => {
    if (source === null) return [];
    const q = query.trim().toLowerCase();
    return source.filter(
      (m) =>
        (filter === null || m.clasificacion === filter) &&
        (q === '' || m.concepto.toLowerCase().includes(q)),
    );
  }, [source, filter, query]);

  const chips = useMemo(
    () => [...new Set((source ?? []).map((m) => m.clasificacion))].sort(),
    [source],
  );

  return { rows, chips };
}

export function MovimientosScreen({ initialTab, ventas, gastos }: MovimientosScreenProps) {
  const [tab, setTab] = useState<string>(initialTab);
  // Switching tabs resets the filter: the keys are not shared.
  const onTab = (v: string) => {
    setTab(v);
    setFilter(null);
  };
  const [range, setRange] = useState('Mayo 2026');
  const [filter, setFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const source = tab === 'gastos' ? gastos : ventas;

  // Filters must actually filter, and the counter must follow — a chip that
  // only highlights is a bug (design handoff).
  const { rows, chips } = useFiltered(source, filter, query);

  return (
    <>
      <Heading />
      <SegmentedTabs
        ariaLabel="Movimientos"
        value={tab}
        onValueChange={onTab}
        tabs={[
          { value: 'ventas', label: 'Ventas', count: ventas?.length ?? 0 },
          { value: 'gastos', label: 'Gastos', count: gastos?.length ?? 0 },
        ]}
      />
      <Filters
        query={query}
        onQuery={setQuery}
        range={range}
        onRange={setRange}
        chips={chips}
        filter={filter}
        onFilter={setFilter}
      />
      <Body source={source} rows={rows} tab={tab} />
    </>
  );
}

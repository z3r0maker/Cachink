'use client';

import type { IsoDate } from '@xangarro/domain';
import { useState } from 'react';

import { DataTable, Pager, ScreenBody, SegmentedTabs, usePagina } from '@/components';
import type { MovimientosData } from '@/server/screens';
import { resolveScreenState } from '@/session/gating';

import { COLUMNS, CategoryChips, Heading, SearchAndRange, type Row } from './parts';
import { DetalleMovimiento } from './detalle-drawer';
import { KpisGastos, KpisVentas } from './kpi-cards';
import { chips as rangeChips } from './periodo';
import { useMovimientos, type Movimientos } from './use-movimientos';

export type TabKey = 'ventas' | 'gastos';

export interface MovimientosScreenProps {
  readonly initialTab: TabKey;
  /** The business's today (`server/clock`): the range chips are relative to it. */
  readonly hoy: IsoDate;
  /** `null` when the read failed — the screen renders its error state. */
  readonly ventas: MovimientosData | null;
  readonly gastos: MovimientosData | null;
}

function Body({ m }: { readonly m: Movimientos }) {
  const p = usePagina(m.rows, 10);
  const [abierto, setAbierto] = useState<Row | null>(null);
  return (
    <ScreenBody
      state={resolveScreenState({ error: m.source === null, isEmpty: m.rows.length === 0 })}
      onRetry={() => window.location.reload()}
      empty={{
        title: `Aún no hay ${m.tab === 'gastos' ? 'gastos' : 'ventas'} en este periodo`,
        body: 'Lo que registren tus operadores en el teléfono aparecerá aquí.',
      }}
    >
      <DataTable
        caption="Movimientos"
        columns={COLUMNS}
        rows={p.visible}
        rowKey={(r) => r.id}
        minWidth={820}
        onRowClick={setAbierto}
        footer={<Pager p={p} noun="movimientos" />}
      />
      <DetalleMovimiento row={abierto} rows={m.rows} onClose={() => setAbierto(null)} />
    </ScreenBody>
  );
}

export function MovimientosScreen({ initialTab, hoy, ventas, gastos }: MovimientosScreenProps) {
  const m = useMovimientos(initialTab, hoy, ventas, gastos);
  return (
    <>
      <Heading kind={m.tab === 'gastos' ? 'gastos' : 'ventas'} />
      <SegmentedTabs
        ariaLabel="Movimientos"
        value={m.tab}
        onValueChange={m.onTab}
        tabs={[
          { value: 'ventas', label: 'Ventas', count: ventas?.length ?? 0 },
          { value: 'gastos', label: 'Gastos', count: gastos?.length ?? 0 },
        ]}
      />
      {m.tab === 'gastos' ? <KpisGastos rows={m.rows} /> : <KpisVentas rows={m.rows} />}
      <SearchAndRange
        query={m.query}
        onQuery={m.setQuery}
        range={m.range}
        onRange={m.setRange}
        ranges={rangeChips(hoy)}
        custom={m.custom}
        onCustom={m.setCustom}
      />
      <CategoryChips chips={m.chips} filter={m.filter} onFilter={m.setFilter} />
      <Body m={m} />
    </>
  );
}

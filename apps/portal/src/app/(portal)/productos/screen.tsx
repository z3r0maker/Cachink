'use client';

import { useMemo, useState } from 'react';

import { ScreenBody, SegmentedTabs } from '@/components';
import { SESSION } from '@/fixtures/business';
import type { ProductosData } from '@/server/screens';
import { canWrite, resolveScreenState } from '@/session/gating';

import {
  CatalogoTable,
  Chips,
  Heading,
  Kpis,
  LowStockBanner,
  MovTable,
  isLow,
  type Movimiento,
  type Producto,
} from './parts';

function Tabs({
  tab,
  onChange,
  catalogCount,
  movCount,
}: {
  readonly tab: string;
  readonly onChange: (v: string) => void;
  readonly catalogCount: number;
  readonly movCount: number;
}) {
  return (
    <SegmentedTabs
      ariaLabel="Productos"
      value={tab}
      onValueChange={onChange}
      tabs={[
        { value: 'catalogo', label: 'Catálogo', count: catalogCount },
        { value: 'movimientos', label: 'Movimientos', count: movCount },
      ]}
    />
  );
}

function Controls({
  tab,
  setTab,
  filter,
  setFilter,
  catalogo,
  movCount,
  isCatalogo,
  low,
}: {
  readonly tab: string;
  readonly setTab: (v: string) => void;
  readonly filter: string;
  readonly setFilter: (v: string) => void;
  readonly catalogo: readonly Producto[];
  readonly movCount: number;
  readonly isCatalogo: boolean;
  readonly low: number;
}) {
  // Switching tabs resets the filter: the keys are not shared.
  const onTab = (v: string) => {
    setTab(v);
    setFilter('Todos');
  };
  return (
    <>
      {isCatalogo && low > 0 ? (
        <LowStockBanner low={low} onShow={() => setFilter('Stock bajo')} />
      ) : null}
      <Tabs tab={tab} onChange={onTab} catalogCount={catalogo.length} movCount={movCount} />
      {isCatalogo ? <Kpis rows={catalogo} /> : null}
      {isCatalogo ? <Chips filter={filter} setFilter={setFilter} /> : null}
    </>
  );
}

function Body({
  isCatalogo,
  rows,
  movimientos,
  error,
}: {
  readonly isCatalogo: boolean;
  readonly rows: readonly Producto[];
  readonly movimientos: readonly Movimiento[];
  readonly error: boolean;
}) {
  return (
    <ScreenBody
      state={resolveScreenState({ error, isEmpty: isCatalogo && rows.length === 0 })}
      onRetry={() => window.location.reload()}
      empty={{
        title: 'Aún no tienes productos',
        body: 'Agrega tu primer producto o impórtalos desde Excel.',
      }}
    >
      {isCatalogo ? <CatalogoTable rows={rows} /> : <MovTable rows={movimientos} />}
    </ScreenBody>
  );
}

export function ProductosScreen({ data }: { readonly data: ProductosData | null }) {
  const [tab, setTab] = useState('catalogo');
  const [filter, setFilter] = useState('Todos');

  const catalogo = data?.catalogo ?? [];
  const rows = useMemo(
    () => (filter === 'Stock bajo' ? catalogo.filter(isLow) : catalogo),
    [catalogo, filter],
  );
  const isCatalogo = tab === 'catalogo';

  return (
    <>
      <Heading mayWrite={canWrite(SESSION.role)} />
      <Controls
        tab={tab}
        setTab={setTab}
        filter={filter}
        setFilter={setFilter}
        catalogo={catalogo}
        movCount={data?.movimientos.length ?? 0}
        isCatalogo={isCatalogo}
        low={catalogo.filter(isLow).length}
      />
      <Body
        isCatalogo={isCatalogo}
        rows={rows}
        movimientos={data?.movimientos ?? []}
        error={data === null}
      />
    </>
  );
}

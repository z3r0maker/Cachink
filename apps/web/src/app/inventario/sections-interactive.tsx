'use client';

import { useState } from 'react';

import { Button, DataTable, Drawer, FilterChip, SegmentedTabs, StatusPill } from '@/components';

import { eyebrow, row, section } from './page.css';
import { COLUMNS, VENTAS, type Venta } from './fixtures';

const TABS = [
  { value: 'ventas', label: 'Ventas', count: 254 },
  { value: 'gastos', label: 'Gastos', count: 86 },
];

const RANGES = ['Hoy', 'Semana', 'Mayo 2026', 'Personalizado'];

function DetailDrawer({
  venta,
  onClose,
}: {
  readonly venta: Venta | null;
  readonly onClose: () => void;
}) {
  return (
    <Drawer
      open={venta !== null}
      onOpenChange={(open) => !open && onClose()}
      heading={venta?.concepto ?? ''}
      description="Detalle del movimiento"
      actions={<Button variant="secondary">Compartir comprobante</Button>}
    >
      <p>{venta?.fecha}</p>
      <StatusPill tone="success">Sincronizado</StatusPill>
    </Drawer>
  );
}

export function Interactive() {
  const [tab, setTab] = useState('ventas');
  const [range, setRange] = useState('Mayo 2026');
  const [selected, setSelected] = useState<Venta | null>(null);

  return (
    <div className={section}>
      <span className={eyebrow}>Pestañas, filtros, tabla y cajón</span>
      <SegmentedTabs tabs={TABS} value={tab} onValueChange={setTab} ariaLabel="Movimientos" />
      <div className={row}>
        {RANGES.map((r) => (
          <FilterChip key={r} label={r} selected={range === r} onSelect={() => setRange(r)} />
        ))}
      </div>
      <DataTable
        caption="Movimientos de ejemplo"
        columns={COLUMNS}
        rows={VENTAS}
        rowKey={(r) => r.id}
        onRowClick={setSelected}
        selectedKey={selected?.id}
        minWidth={720}
        footer={<span>Mostrando 3 de 254 movimientos</span>}
      />
      <DetailDrawer venta={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

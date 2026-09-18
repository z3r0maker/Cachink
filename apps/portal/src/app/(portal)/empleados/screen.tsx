'use client';

import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import {
  DataTable,
  KpiCard,
  ScreenBody,
  SegmentedTabs,
  StatusPill,
  kpiGrid,
  type ColumnDef,
} from '@/components';
import { useSession } from '@/session/provider';
import type { EmpleadosData } from '@/server/screens';
import { canWrite, resolveScreenState } from '@/session/gating';
import { eyebrow } from '@/styles/text.css';

import { NuevoEmpleadoDialog } from './new-dialog';
import { pageSubtitle, pageTitle } from './empleados.css';

type Empleado = EmpleadosData[number];

const COLUMNS: readonly ColumnDef<Empleado>[] = [
  {
    key: 'empleado',
    header: 'Empleado',
    render: (e) => (
      <span>
        <span style={{ fontWeight: 800, display: 'block' }}>{e.nombre}</span>
        <span className={eyebrow}>{e.puesto}</span>
      </span>
    ),
  },
  {
    key: 'periodo',
    header: 'Periodo',
    render: (e) => <StatusPill tone="soft">{e.periodo}</StatusPill>,
  },
  { key: 'salario', header: 'Salario', numeric: true, render: (e) => formatMoney(e.salario ?? 0n) },
];

function Heading() {
  const session = useSession();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Empleados</h1>
        <p className={pageSubtitle}>Quién trabaja contigo y cuánto le pagas</p>
      </div>
      {canWrite(session.role) ? (
        <div style={{ marginLeft: 'auto' }}>
          <NuevoEmpleadoDialog />
        </div>
      ) : null}
    </div>
  );
}

function Body({
  rows,
  list,
}: {
  readonly rows: EmpleadosData | null;
  readonly list: EmpleadosData;
}) {
  return (
    <ScreenBody
      state={resolveScreenState({ error: rows === null, isEmpty: list.length === 0 })}
      onRetry={() => window.location.reload()}
      empty={{
        title: 'No hay empleados registrados',
        body: 'Agrega a quienes trabajan contigo para llevar tu nómina.',
      }}
    >
      <DataTable
        caption="Personas"
        columns={COLUMNS}
        rows={list}
        rowKey={(e) => e.id}
        minWidth={620}
        footer={
          <span>
            Cada pago de nómina se registra también como un gasto, capturado en el teléfono.
          </span>
        }
      />
    </ScreenBody>
  );
}

export function EmpleadosScreen({ rows }: { readonly rows: EmpleadosData | null }) {
  const [tab, setTab] = useState('personas');
  const list = rows ?? [];
  const semana = list.reduce((t, e) => t + (e.salario ?? 0n), 0n);

  return (
    <>
      <Heading />
      <SegmentedTabs
        ariaLabel="Empleados"
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: 'personas', label: 'Personas', count: list.length },
          { value: 'nomina', label: 'Nómina' },
        ]}
      />
      <div className={kpiGrid}>
        <KpiCard label="Empleados activos" value={`${list.length}`} />
        <KpiCard label="Nómina de la semana" value={formatMoney(semana)} tone="negative" />
      </div>
      <Body rows={rows} list={list} />
    </>
  );
}

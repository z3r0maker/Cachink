'use client';

import { useState } from 'react';
import { formatMoney, salarioSemanal } from '@xangarro/domain';

import {
  Button,
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

import { PagosEmpleadoDrawer } from './pagos-drawer';
import { EditarEmpleadoSheet, NuevoEmpleadoSheet } from './sheet';
import type { Empleado as Row } from './use-empleado-form';
import { avatar, pageSubtitle, pageTitle } from './empleados.css';

type Empleado = EmpleadosData[number];

const PERIODO_LABEL = { semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual' } as const;

/** The trailing action columns: pagos for everyone, edit for writers only. */
function acciones(
  onEdit: ((e: Row) => void) | null,
  onPagos: ((e: Row) => void) | null,
): readonly ColumnDef<Empleado>[] {
  return [
    {
      key: 'pagos',
      header: '',
      render: (e: Row) => (
        <Button
          variant="ghost"
          onClick={() => onPagos?.(e)}
          aria-label={`Ver los pagos de ${e.nombre}`}
          data-testid={`ver-pagos-${e.id}`}
        >
          Ver pagos
        </Button>
      ),
    },
    ...(onEdit === null
      ? []
      : [
          {
            key: 'acciones',
            header: '',
            render: (e: Row) => (
              <Button variant="ghost" onClick={() => onEdit(e)} aria-label={`Editar a ${e.nombre}`}>
                Editar
              </Button>
            ),
          },
        ]),
  ];
}

/** Two initials, the same rule the operator cards use. */
const iniciales = (n: string) =>
  n
    .split(' ')
    .slice(0, 2)
    .map((w) => w.slice(0, 1))
    .join('')
    .toLocaleUpperCase('es-MX');

/** The circular avatar the design puts before the name (C-6). */
function EmpleadoCell({ e }: { readonly e: Empleado }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className={avatar} aria-hidden="true">
        {iniciales(e.nombre)}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ fontWeight: 800, display: 'block' }}>{e.nombre}</span>
        <span className={eyebrow}>{e.puesto}</span>
      </span>
    </span>
  );
}

const columns = (
  onEdit: ((e: Row) => void) | null,
  onPagos: ((e: Row) => void) | null,
): readonly ColumnDef<Empleado>[] => [
  { key: 'empleado', header: 'Empleado', render: (e) => <EmpleadoCell e={e} /> },
  {
    key: 'periodo',
    header: 'Periodo',
    render: (e) => <StatusPill tone="soft">{PERIODO_LABEL[e.periodo]}</StatusPill>,
  },
  {
    // The design's column is weekly whatever the period, so a monthly wage
    // and a weekly one can be read down one column without converting in
    // your head — `salarioSemanal` is the same domain rule the KPI above
    // already uses. The per-period figure keeps its place as the subline.
    key: 'semanal',
    header: 'Sueldo semanal',
    numeric: true,
    render: (e) => (
      <span>
        <span style={{ display: 'block', fontWeight: 800 }}>
          {formatMoney(salarioSemanal(e.salario ?? 0n, e.periodo))}
        </span>
        <span className={eyebrow}>
          {formatMoney(e.salario ?? 0n)} {PERIODO_LABEL[e.periodo].toLocaleLowerCase('es-MX')}
        </span>
      </span>
    ),
  },
  ...acciones(onEdit, onPagos),
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
          <NuevoEmpleadoSheet />
        </div>
      ) : null}
    </div>
  );
}

function Body({
  rows,
  list,
  onEdit,
  onPagos,
}: {
  readonly rows: EmpleadosData | null;
  readonly list: EmpleadosData;
  readonly onEdit: ((e: Row) => void) | null;
  readonly onPagos: (e: Row) => void;
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
        columns={columns(onEdit, onPagos)}
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
  const [editing, setEditing] = useState<Row | null>(null);
  const [enPagos, setEnPagos] = useState<Row | null>(null);
  const mayWrite = canWrite(useSession().role);
  const list = rows ?? [];
  // Weekly equivalent: a quincenal or mensual salary is not a week's pay.
  const semana = list.reduce((t, e) => t + salarioSemanal(e.salario ?? 0n, e.periodo), 0n);

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
      <Body rows={rows} list={list} onEdit={mayWrite ? setEditing : null} onPagos={setEnPagos} />
      <EditarEmpleadoSheet empleado={editing} onClose={() => setEditing(null)} />
      <PagosEmpleadoDrawer empleado={enPagos} onClose={() => setEnPagos(null)} />
    </>
  );
}

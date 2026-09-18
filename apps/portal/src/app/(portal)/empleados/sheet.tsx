'use client';

import { useState } from 'react';

import { Button, Drawer, Input, OptionCards } from '@/components';

import { useEmpleadoForm, type Empleado } from './use-empleado-form';

/**
 * The employee sheet (P-12): «Nuevo empleado» and «Editar» are one form —
 * nombre, puesto, salario per period and the period as three option cards
 * (CLAUDE.md §6: ≤5 choices are cards). Editing adds «Dar de baja».
 */
const PERIODOS = [
  { value: 'semanal', title: 'Semanal', description: 'Le pagas cada semana.' },
  { value: 'quincenal', title: 'Quincenal', description: 'Los días 15 y último del mes.' },
  { value: 'mensual', title: 'Mensual', description: 'Una vez al mes.' },
];

type Form = ReturnType<typeof useEmpleadoForm>;

function Fields({ f }: { readonly f: Form }) {
  return (
    <>
      <Input
        labelText="Nombre"
        value={f.draft.nombre}
        error={f.campos.nombre}
        onChange={(e) => f.set({ nombre: e.target.value })}
        data-testid="empleado-nombre"
      />
      <Input
        labelText="Puesto"
        value={f.draft.puesto}
        error={f.campos.puesto}
        onChange={(e) => f.set({ puesto: e.target.value })}
        data-testid="empleado-puesto"
      />
      <Input
        labelText="Salario por periodo"
        hintText="En pesos, por ejemplo 2100.00"
        numeric
        value={f.draft.salario}
        error={f.campos.salario}
        onChange={(e) => f.set({ salario: e.target.value })}
        data-testid="empleado-salario"
      />
      <OptionCards
        ariaLabel="Cada cuánto le pagas"
        options={PERIODOS}
        value={f.draft.periodo}
        onValueChange={(v) => f.set({ periodo: v })}
      />
    </>
  );
}

function Actions({ f, editing }: { readonly f: Form; readonly editing: boolean }) {
  return (
    <>
      {f.error === null ? null : <span role="alert">{f.error}</span>}
      {editing ? (
        <Button variant="danger" onClick={f.baja} disabled={f.pending}>
          Dar de baja
        </Button>
      ) : null}
      <Button onClick={f.save} disabled={f.pending}>
        {f.pending ? 'Guardando…' : 'Guardar'}
      </Button>
    </>
  );
}

function EmpleadoSheet(props: {
  readonly editing: Empleado | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const f = useEmpleadoForm(props.editing, () => props.onOpenChange(false));
  return (
    <Drawer
      open={props.open}
      onOpenChange={props.onOpenChange}
      heading={props.editing ? `Editar a ${props.editing.nombre}` : 'Nuevo empleado'}
      description="Quién trabaja contigo y cuánto le pagas por periodo."
      actions={<Actions f={f} editing={props.editing !== null} />}
    >
      <Fields f={f} />
    </Drawer>
  );
}

export function NuevoEmpleadoSheet() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Nuevo empleado</Button>
      <EmpleadoSheet editing={null} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditarEmpleadoSheet(props: {
  readonly empleado: Empleado | null;
  readonly onClose: () => void;
}) {
  return (
    // Keyed by row: each employee opens on its own saved values.
    <EmpleadoSheet
      key={props.empleado?.id ?? 'cerrado'}
      editing={props.empleado}
      open={props.empleado !== null}
      onOpenChange={(o) => (o ? undefined : props.onClose())}
    />
  );
}

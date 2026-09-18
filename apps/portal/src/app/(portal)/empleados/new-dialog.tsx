'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button, ConfirmDialog, Input } from '@/components';
import { crearEmpleado } from '@/server/actions/empleados';
import { pesosToCentavos } from '@/lib/money';

type Periodo = 'semanal' | 'quincenal' | 'mensual';

interface Draft {
  nombre: string;
  puesto: string;
  salario: string;
  periodo: Periodo;
}

const EMPTY: Draft = { nombre: '', puesto: '', salario: '', periodo: 'semanal' };

function useNuevoEmpleado(onClose: () => void) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const set = (patch: Partial<Draft>): void => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  };

  function save(): void {
    const salarioCentavos = pesosToCentavos(draft.salario);
    if (draft.nombre.trim().length === 0) return setError('Escribe el nombre.');
    if (draft.puesto.trim().length === 0) return setError('Escribe el puesto.');
    if (salarioCentavos === null) return setError('Escribe el salario, por ejemplo 2100.00');

    startTransition(async () => {
      const result = await crearEmpleado({
        nombre: draft.nombre,
        puesto: draft.puesto,
        salarioCentavos,
        periodo: draft.periodo,
      });
      if (!result.ok) return setError(result.message);
      setDraft(EMPTY);
      onClose();
      router.refresh();
    });
  }

  return { draft, set, error, pending, save };
}

function Fields({
  draft,
  error,
  set,
}: {
  readonly draft: Draft;
  readonly error: string | null;
  readonly set: (patch: Partial<Draft>) => void;
}) {
  return (
    <>
      <Input
        labelText="Nombre"
        value={draft.nombre}
        onChange={(e) => set({ nombre: e.target.value })}
        data-testid="empleado-nombre"
      />
      <Input
        labelText="Puesto"
        value={draft.puesto}
        onChange={(e) => set({ puesto: e.target.value })}
        data-testid="empleado-puesto"
      />
      <Input
        labelText="Salario por periodo"
        hintText="En pesos, por ejemplo 2100.00"
        numeric
        value={draft.salario}
        onChange={(e) => set({ salario: e.target.value })}
        error={error ?? undefined}
        data-testid="empleado-salario"
      />
    </>
  );
}

export function NuevoEmpleadoDialog() {
  const [open, setOpen] = useState(false);
  const { draft, set, error, pending, save } = useNuevoEmpleado(() => setOpen(false));

  return (
    <>
      <Button onClick={() => setOpen(true)}>Nuevo empleado</Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Nuevo empleado"
        body="Quién trabaja contigo y cuánto le pagas por periodo."
        confirmLabel={pending ? 'Guardando…' : 'Guardar'}
        onConfirm={save}
      >
        <Fields draft={draft} error={error} set={set} />
      </ConfirmDialog>
    </>
  );
}

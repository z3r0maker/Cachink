'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button, ConfirmDialog, Input } from '@/components';
import { crearEmpleado } from '@/server/actions/empleados';

type Periodo = 'semanal' | 'quincenal' | 'mensual';

interface Draft {
  nombre: string;
  puesto: string;
  salario: string;
  periodo: Periodo;
}

const EMPTY: Draft = { nombre: '', puesto: '', salario: '', periodo: 'semanal' };

/**
 * Pesos in, centavos out.
 *
 * The shopkeeper types `2100.50`; the column is integer centavos (CLAUDE.md
 * §2.8). Rounding at this boundary is the only place a float is allowed to
 * exist, and it stops existing immediately. Rejects anything that is not a
 * plain positive amount rather than coercing it — `Number('')` is 0, and a
 * silent zero salary is worse than a refusal.
 */
export function pesosToCentavos(input: string): number | null {
  const trimmed = input.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number.parseFloat(trimmed) * 100);
}

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

'use client';

import { toPesosString } from '@xangarro/domain';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { darDeBajaEmpleado, guardarEmpleado } from '@/server/actions/empleados';
import type { EmpleadosData } from '@/server/screens';

export type Empleado = EmpleadosData[number];

export interface Draft {
  readonly nombre: string;
  readonly puesto: string;
  readonly salario: string;
  readonly periodo: string;
}

/** Quincenal is the default: it is how most small businesses in México pay. */
const EMPTY: Draft = { nombre: '', puesto: '', salario: '', periodo: 'quincenal' };

const draftOf = (e: Empleado | null): Draft =>
  e === null
    ? EMPTY
    : {
        nombre: e.nombre,
        puesto: e.puesto,
        salario: toPesosString(e.salario ?? 0n),
        periodo: e.periodo,
      };

/** One form for «Nuevo empleado» and «Editar»; the server holds the rules. */
export function useEmpleadoForm(editing: Empleado | null, onDone: () => void) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(editing));
  const [campos, setCampos] = useState<Readonly<Record<string, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setCampos({});
    setError(null);
  };
  const run = (op: () => ReturnType<typeof guardarEmpleado>) =>
    startTransition(async () => {
      const r = await op();
      if (!r.ok) {
        setCampos(r.campos);
        setError(r.message);
        return;
      }
      setDraft(EMPTY);
      onDone();
      router.refresh();
    });
  const save = () => run(() => guardarEmpleado(editing?.id ?? null, draft));
  const baja = () => (editing === null ? undefined : run(() => darDeBajaEmpleado(editing.id)));
  return { draft, set, campos, error, pending, save, baja };
}

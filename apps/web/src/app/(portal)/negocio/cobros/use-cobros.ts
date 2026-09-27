'use client';

import { parseMetodosPago, type MetodoConfigurable } from '@xangarro/domain';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { guardarNegocio } from '@/server/actions/guardar-negocio';
import { cambiarFuncion } from '@/server/actions/funciones';

import { draftOf, formOf, type Business } from '../edicion/draft';

/**
 * Cobros (P-08, CfgCobros): each switch saves at once. The three methods go
 * through «Guardar negocio» (the whole business as one validated patch, one
 * change for the phones); Fiado is the `ventasCredito` Función. The last
 * method on refuses to go off and says why, on its own card.
 */
export type Clave = MetodoConfigurable | 'Fiado';

export function useCobros(business: Business, fiadoInicial: boolean) {
  const router = useRouter();
  const [metodos, setMetodos] = useState<readonly string[]>(() =>
    parseMetodosPago(business.enabledPaymentMethods),
  );
  const [fiado, setFiado] = useState(fiadoInicial);
  const [ultimo, setUltimo] = useState<Clave | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const guardarMetodos = (next: readonly string[]) =>
    startTransition(async () => {
      const antes = metodos;
      setMetodos(next);
      const r = await guardarNegocio(formOf(business, { ...draftOf(business), metodosPago: next }));
      if (!r.ok) setMetodos(antes);
      setError(r.ok ? null : (r.errores.campos.metodosPago ?? r.message));
      if (r.ok) router.refresh();
    });

  const guardarFiado = (on: boolean) =>
    startTransition(async () => {
      setFiado(on);
      const r = await cambiarFuncion('ventasCredito', on);
      if (!r.ok) setFiado(!on);
      setError(r.ok ? null : r.message);
      if (r.ok) router.refresh();
    });

  const toggle = (m: MetodoConfigurable, on: boolean) => {
    if (!on && metodos.length === 1 && metodos.includes(m)) return setUltimo(m);
    setUltimo(null);
    guardarMetodos(on ? [...metodos, m] : metodos.filter((x) => x !== m));
  };

  return { metodos, fiado, ultimo, error, pending, toggle, guardarFiado };
}

export type Cobros = ReturnType<typeof useCobros>;

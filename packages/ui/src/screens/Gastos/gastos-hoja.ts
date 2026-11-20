/**
 * Which Gastos sheet is open (M-08): «Registrar gasto», or «Pagar» on a due
 * recurring gasto. A template Inicio's «Para hoy» sent opens itself, as the
 * web's cajón does.
 */
import { useEffect, useState } from 'react';
import type { PrefillGasto, RecurrentePorPagar } from '@xangarro/caja/gastos';

export type Hoja =
  { readonly kind: 'registrar' } | { readonly kind: 'pagar'; readonly x: RecurrentePorPagar };

export function useHoja(
  prefill: PrefillGasto | null,
  porPagar: readonly RecurrentePorPagar[] | null,
): { readonly hoja: Hoja | null; readonly abrir: (h: Hoja) => void; readonly cerrar: () => void } {
  const [hoja, setHoja] = useState<Hoja | null>(null);
  useEffect(() => {
    if (prefill === null) return;
    const x = (porPagar ?? []).find((p) => p.prefill.recurrenteId === prefill.recurrenteId);
    if (x !== undefined) setHoja({ kind: 'pagar', x });
  }, [prefill, porPagar]);
  return { hoja, abrir: setHoja, cerrar: () => setHoja(null) };
}

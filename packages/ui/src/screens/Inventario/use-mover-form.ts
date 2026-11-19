/**
 * The movement sheet's save (M-09): through the route's write, closing on
 * success and saying so on failure. The form's rules are `mover-logica.ts`.
 */
import { useState } from 'react';

export interface GuardarHoja<T> {
  readonly guardando: boolean;
  readonly error: boolean;
  readonly guardar: (x: T | null) => Promise<void>;
}

/** Save through the route's write: close on success, say so on failure. */
export function useGuardarHoja<T>(
  onGuardar: (x: T) => Promise<void>,
  onListo: () => void,
): GuardarHoja<T> {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(false);
  const guardar = async (x: T | null): Promise<void> => {
    if (x === null || guardando) return;
    setGuardando(true);
    setError(false);
    try {
      await onGuardar(x);
      onListo();
    } catch {
      setError(true);
    } finally {
      setGuardando(false);
    }
  };
  return { guardando, error, guardar };
}

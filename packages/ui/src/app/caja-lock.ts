/**
 * Who locked the caja (MvBloqueo). Locking signs the operator out
 * (`userId → null`: «Bloquear la caja», the rail's lock, the auto-lock) but
 * the turno stays theirs, so the gate shows Bloqueo for that person instead
 * of Acceso. Kept apart from the persisted app config: a restart asks
 * «¿Quién va a cobrar?» again.
 *
 * It follows the session store instead of every lock button: any
 * signed-in → signed-out change records the person; any sign-in clears it.
 * «No soy …» clears it by hand.
 */
import { create } from 'zustand';
import type { UserId } from '@xangarro/domain';
import { useAppConfigStore } from '../app-config/use-app-config';

interface CajaLockState {
  readonly bloqueadaPor: UserId | null;
  readonly soltar: () => void;
}

export const useCajaLock = create<CajaLockState>((set) => ({
  bloqueadaPor: null,
  soltar: () => set({ bloqueadaPor: null }),
}));

/** The transition rule, pure for the tests. */
export function siguienteBloqueo(
  actual: UserId | null,
  antes: UserId | null,
  ahora: UserId | null,
): UserId | null {
  if (ahora !== null) return null;
  if (antes !== null) return antes;
  return actual;
}

useAppConfigStore.subscribe((s, prev) => {
  if (s.userId === prev.userId) return;
  const actual = useCajaLock.getState().bloqueadaPor;
  const next = siguienteBloqueo(actual, prev.userId, s.userId);
  if (next !== actual) useCajaLock.setState({ bloqueadaPor: next });
});

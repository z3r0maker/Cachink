/**
 * The turno an operator chose to continue (M-18, ADR-071 §3; MvTurnoDeOtro).
 * One open turno per caja: when someone signs in while another person's
 * turno is open, the phone asks whether to continue it or count and close
 * it. Choosing to continue is remembered for that person and that turno, so
 * the question does not come back on every screen. In memory, like the lock
 * (`caja-lock.ts`): a restart asks again.
 */
import { create } from 'zustand';

export interface Seguido {
  readonly turnoId: string;
  readonly userId: string;
}

interface TurnoSeguidoState {
  readonly seguido: Seguido | null;
  readonly seguir: (turnoId: string, userId: string) => void;
}

export const useTurnoSeguido = create<TurnoSeguidoState>((set) => ({
  seguido: null,
  seguir: (turnoId, userId) => set({ seguido: { turnoId, userId } }),
}));

/** Whether the signed-in operator must choose: continue or close someone else's turno. */
export function debeElegir(
  turno: { readonly id: string; readonly userId: string } | null,
  userId: string | null,
  seguido: Seguido | null,
): boolean {
  if (turno === null || userId === null || turno.userId === userId) return false;
  return !(seguido?.turnoId === turno.id && seguido.userId === userId);
}

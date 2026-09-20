/**
 * Who stands at this register right now (O-12 → O-13): the operator that
 * opened the turno and the turno itself, in sessionStorage — the register
 * forgets it on a closed tab (the gate re-asks), but keeps it across reloads
 * while the turno stays open. The capture path (O-06) reads it to stamp
 * `createdByUserId` and `cajaTurnoId` on every ticket.
 */

export interface SesionCaja {
  readonly userId: string;
  readonly nombre: string;
  readonly turnoId: string;
}

const KEY = 'xangarro.sesion';

export function readSesion(): SesionCaja | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const s = parsed as SesionCaja;
    if (typeof s.userId !== 'string' || typeof s.turnoId !== 'string') return null;
    return s;
  } catch {
    return null;
  }
}

export function writeSesion(s: SesionCaja): void {
  sessionStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSesion(): void {
  sessionStorage.removeItem(KEY);
}

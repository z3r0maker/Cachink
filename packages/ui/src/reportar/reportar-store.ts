/**
 * Whether the report sheet is open (M-23, ADR-162): one sheet for the whole
 * caja, opened from the header's help button on every tab, from Mi turno's
 * «¿Algo no funciona?» and from Ajustes. A sheet opened from a failure names
 * that failure's event, so the report says which error it is about.
 */
import { create } from 'zustand';

interface ReportarState {
  readonly abierto: boolean;
  /** The Sentry event the sheet was opened from, when it was. */
  readonly eventId: string | null;
  readonly abrir: (eventId?: string | null) => void;
  readonly cerrar: () => void;
}

export const useReportar = create<ReportarState>((set) => ({
  abierto: false,
  eventId: null,
  abrir: (eventId = null) => set({ abierto: true, eventId }),
  cerrar: () => set({ abierto: false, eventId: null }),
}));

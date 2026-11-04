/**
 * Whether the app has its first real screen up (MarcaSplashAnimado): the
 * connect screen, the operator sign-in or the app, or the database's error
 * screen when it cannot open. The animated splash waits for it, then fades.
 * A module-level store so the splash, which sits above every provider, and
 * the gates under them can share it.
 */
import { useEffect } from 'react';
import { create } from 'zustand';

interface ArranqueState {
  readonly listo: boolean;
  readonly marcarListo: () => void;
}

export const useArranque = create<ArranqueState>((set) => ({
  listo: false,
  marcarListo: () => set({ listo: true }),
}));

/** Rendered by a screen that is ready to be seen; marks the start done. */
export function useMarcarArranqueListo(activo = true): void {
  useEffect(() => {
    if (activo) useArranque.getState().marcarListo();
  }, [activo]);
}

'use client';

import { useEffect, useState } from 'react';

/** How often a countdown («Reintentando en 2 min», «hace 3 min») is said again. */
const CADA_MS = 15_000;

/** The clock, re-read every 15 s while `activo`: countdowns move without a new read. */
export function useAhora(activo: boolean): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    setAhora(Date.now());
    if (!activo) return;
    const t = setInterval(() => setAhora(Date.now()), CADA_MS);
    return () => clearInterval(t);
  }, [activo]);
  return ahora;
}

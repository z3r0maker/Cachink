/**
 * The clock for countdowns (DS-05, DS-07): «Reintentando en 2 min», «hace
 * 3 min» are said again every 15 s while `activo`, without a new read.
 */
import { useEffect, useState } from 'react';

const CADA_MS = 15_000;

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

'use client';

import { useEffect, useRef, useState } from 'react';

import { useCola } from '../shell/cola';
import { fase } from './derive';
import type { RegistroEnCola } from './types';

/** How long the fixture «send» takes, as in the file. */
const ENVIO_MS = 1400;

/**
 * The queue and «Reintentar envío». Until the outbox flusher exists (O-06) a
 * retry always succeeds after the file's 1.4 s; the shell's pill follows.
 */
export function usePendientes(inicial: readonly RegistroEnCola[]) {
  const shell = useCola();
  const [cola, setCola] = useState(shell.pendientes === 0 ? [] : inicial);
  const [enviando, setEnviando] = useState(false);
  const [enCola, setEnCola] = useState(cola.length);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), []);
  const reintentar = () => {
    if (enviando) return;
    setEnCola(cola.length);
    setEnviando(true);
    timer.current = setTimeout(() => {
      setEnviando(false);
      setCola([]);
      shell.vaciada();
    }, ENVIO_MS);
  };
  return {
    cola,
    enCola,
    fase: fase(cola, enviando),
    offline: shell.connection === 'sin-conexion',
    reintentar,
  };
}

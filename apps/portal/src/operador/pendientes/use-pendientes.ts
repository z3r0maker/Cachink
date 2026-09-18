'use client';

import { useState } from 'react';

import { useCola } from '../shell/cola';
import { fase } from './derive';
import type { RegistroEnCola } from './types';

/** The queue as the shell holds it: empty once a send went through. */
export function usePendientes(inicial: readonly RegistroEnCola[]) {
  const shell = useCola();
  const cola = shell.pendientes === 0 ? [] : inicial;
  const [enCola, setEnCola] = useState(cola.length);
  const reintentar = () => {
    setEnCola(cola.length);
    shell.enviar();
  };
  return {
    cola,
    enCola,
    fase: fase(cola, shell.enviando),
    offline: shell.connection === 'sin-conexion',
    reintentar,
  };
}

'use client';

import { useEffect, useRef, useState } from 'react';

import { useCola } from '../shell/cola';
import { fase, type EnvioVivo, type RegistroEnCola } from '@xangarro/caja/pendientes';

/** Opening the screen online with something queued sends it, once. */
function useEnvioAlAbrir(vivo: EnvioVivo | undefined, hay: boolean, enviar: () => void): void {
  const intentado = useRef(false);
  useEffect(() => {
    if (vivo === undefined || !vivo.listo || intentado.current) return;
    intentado.current = true;
    if (hay && navigator.onLine) enviar();
  });
}

/**
 * The queue as the screen shows it. Unlinked: the design's queue, empty once
 * the shell's fixture send went through. Linked: the outbox as last read,
 * «enviando» while the real flush runs (this screen's or anyone's).
 */
export function usePendientes(inicial: readonly RegistroEnCola[], vivo?: EnvioVivo) {
  const shell = useCola();
  const [propio, setPropio] = useState(false);
  const cola = vivo || shell.pendientes !== 0 ? inicial : [];
  const [enCola, setEnCola] = useState(cola.length);
  const reintentar = () => {
    setEnCola(cola.length);
    if (vivo === undefined) {
      shell.enviar();
      return;
    }
    if (propio) return;
    setPropio(true);
    void vivo.enviar().finally(() => setPropio(false));
  };
  useEnvioAlAbrir(vivo, cola.length > 0, reintentar);
  const f = fase(cola, shell.enviando || propio);
  return {
    cola,
    enCola: f === 'enviando' && propio ? enCola : cola.length,
    fase: f,
    offline: shell.connection === 'sin-conexion',
    reintentar,
  };
}

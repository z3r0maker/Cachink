'use client';

import { useEffect, useState } from 'react';

import type { OperadorPara } from '../runtime/protocol';

/** Three wrong NIPs clear the pick (ADR-072 §3: the limit is ours). */
const INTENTOS = 3;

export type Tecla = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '⌫' | '→';

export interface EstadoNip {
  readonly elegido: OperadorPara | null;
  readonly elegir: (o: OperadorPara) => void;
  readonly nip: string;
  readonly fallidos: number;
  readonly restantes: number;
  readonly ocupado: boolean;
  readonly press: (k: Tecla) => void;
}

/**
 * The NIP entry's state machine: pick, type, verify, count the misses, and
 * clear the pick at three. A register with one operator comes pre-picked.
 */
export function useNip(p: {
  readonly operadores: readonly OperadorPara[];
  readonly verificar: (nombre: string, nip: string) => Promise<{ success: boolean }>;
  readonly onAutenticado: (userId: string) => void;
}): EstadoNip {
  const [elegidoId, setElegidoId] = useState<string | null>(null);
  const [nip, setNip] = useState('');
  const [fallidos, setFallidos] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const solo = p.operadores.length === 1 ? (p.operadores[0] ?? null) : null;
  const elegido = p.operadores.find((o) => o.id === elegidoId) ?? solo;

  async function entrar(): Promise<void> {
    if (elegido === null || nip.length !== 4 || ocupado) return;
    setOcupado(true);
    try {
      const result = await p.verificar(elegido.nombre, nip);
      if (result.success) return p.onAutenticado(elegido.id);
      const siguiente = fallidos + 1;
      setNip('');
      setFallidos(siguiente >= INTENTOS ? 0 : siguiente);
      if (siguiente >= INTENTOS) setElegidoId(null);
    } finally {
      setOcupado(false);
    }
  }

  function press(k: Tecla): void {
    if (elegido === null) return;
    if (k === '⌫') return setNip((cur) => cur.slice(0, -1));
    if (k === '→') return void entrar();
    setNip((cur) => (cur.length >= 4 ? cur : cur + k));
  }

  function elegir(o: OperadorPara): void {
    setElegidoId(o.id);
    setNip('');
    setFallidos(0);
  }

  const restantes = INTENTOS - fallidos;
  return { elegido, elegir, nip, fallidos, restantes, ocupado, press };
}

/** A physical keyboard works too: digits, Backspace and Enter. */
export function useTecladoFisico(press: (k: Tecla) => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;
      if (/^\d$/.test(e.key)) press(e.key as Tecla);
      else if (e.key === 'Backspace') press('⌫');
      else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) press('→');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);
}

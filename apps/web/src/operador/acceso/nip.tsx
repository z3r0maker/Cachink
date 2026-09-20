'use client';

import { useState, type ReactNode } from 'react';

import type { OperadorPara } from '../runtime/protocol';

import * as a from './acceso.css';

/** Three wrong NIPs return to the picker (ADR-072 §3 — the limit is ours). */
const INTENTOS = 3;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '→'] as const;
type Key = (typeof KEYS)[number];

function iniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

function Picker(p: {
  readonly operadores: readonly OperadorPara[];
  readonly onElegir: (o: OperadorPara) => void;
}) {
  return (
    <>
      <h1 className={a.title}>¿Quién abre turno?</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {p.operadores.map((o) => (
          <button
            key={o.id}
            type="button"
            className={a.operadorRow}
            data-testid="acceso-operador"
            onClick={() => p.onElegir(o)}
          >
            <span className={a.initials}>{iniciales(o.nombre)}</span>
            {o.nombre}
          </button>
        ))}
      </div>
      <p className={a.body}>
        Si olvidaste tu NIP, Pedro lo reinicia desde el portal, en Operadores y dispositivos. Nadie
        más puede cambiarlo desde la caja.
      </p>
    </>
  );
}

function TecladoNip(p: {
  readonly nip: string;
  readonly bloqueado: boolean;
  readonly onKey: (k: Key) => void;
}) {
  return (
    <>
      <div className={a.nipBoxes} data-testid="nip-cajas">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={a.nipBox}>
            {p.nip[i] ?? ''}
          </span>
        ))}
      </div>
      <div className={a.keypad}>
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={a.key}
            disabled={p.bloqueado}
            data-testid={`nip-tecla-${k}`}
            onClick={() => p.onKey(k)}
          >
            {k}
          </button>
        ))}
      </div>
    </>
  );
}

/** The NIP entry's state machine: type, verify, count the misses, lock at 3. */
function useNip(p: {
  readonly operadores: readonly OperadorPara[];
  readonly verificar: (nombre: string, nip: string) => Promise<{ success: boolean }>;
  readonly onAutenticado: (userId: string) => void;
}) {
  const [elegido, setElegido] = useState<OperadorPara | null>(null);
  const [nip, setNip] = useState('');
  const [fallidos, setFallidos] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const intentosRestantes = INTENTOS - fallidos;
  const bloqueado = intentosRestantes <= 0;

  async function continuar(): Promise<void> {
    if (elegido === null || nip.length !== 4 || ocupado || bloqueado) return;
    setOcupado(true);
    try {
      const result = await p.verificar(elegido.nombre, nip);
      if (result.success) {
        p.onAutenticado(elegido.id);
        return;
      }
      const siguiente = fallidos + 1;
      setFallidos(siguiente);
      setNip('');
      if (siguiente >= INTENTOS) {
        setElegido(null);
        setFallidos(0);
      }
    } finally {
      setOcupado(false);
    }
  }

  function press(k: Key): void {
    if (bloqueado) return;
    if (k === '⌫') return setNip((cur) => cur.slice(0, -1));
    if (k === '→') return void continuar();
    setNip((cur) => (cur.length >= 4 ? cur : cur + k));
  }

  return { elegido, setElegido, nip, fallidos, bloqueado, ocupado, press, intentosRestantes };
}

/** «NIP incorrecto. Te quedan N intentos.» — the design's own line. */
function Intentos(p: { readonly fallidos: number; readonly restantes: number }): ReactNode {
  if (p.fallidos <= 0 || p.restantes <= 0) return null;
  return (
    <p className={a.error} data-testid="nip-error">
      NIP incorrecto. Te quedan {p.restantes} intento{p.restantes === 1 ? '' : 's'}.
    </p>
  );
}

/**
 * Paso 2 · ¿Quién abre turno? The operator, then their four-digit NIP —
 * verified on the device against the hash the bootstrap carried.
 */
export function Nip(p: {
  readonly operadores: readonly OperadorPara[];
  readonly negocio: string;
  readonly onAutenticado: (userId: string) => void;
  readonly onCambiarOperador: () => void;
  readonly verificar: (nombre: string, nip: string) => Promise<{ success: boolean }>;
}) {
  const s = useNip({
    operadores: p.operadores,
    verificar: p.verificar,
    onAutenticado: p.onAutenticado,
  });
  return (
    <>
      <span className={a.paso}>Paso 2 de 2 · {p.negocio}</span>
      {s.elegido === null ? (
        <Picker operadores={p.operadores} onElegir={s.setElegido} />
      ) : (
        <>
          <h1 className={a.title}>Tu NIP de cuatro dígitos</h1>
          <p className={a.body}>
            {s.elegido.nombre} ·{' '}
            <button
              type="button"
              style={{ textDecoration: 'underline' }}
              onClick={p.onCambiarOperador}
            >
              cambiar
            </button>
          </p>
          <TecladoNip nip={s.nip} bloqueado={s.bloqueado} onKey={s.press} />
          <Intentos fallidos={s.fallidos} restantes={s.intentosRestantes} />
        </>
      )}
    </>
  );
}

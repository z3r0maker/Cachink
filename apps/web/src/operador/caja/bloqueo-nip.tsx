'use client';

import { useEffect, type ReactNode } from 'react';

import * as b from './bloqueo-nip.css';

export const BLOQUEO_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'] as const;
export type Tecla = (typeof BLOQUEO_KEYS)[number];

const DIGITOS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
const BORRAR = [
  'M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z',
  'm12 9 6 6',
  'm18 9-6 6',
];

/** The lock's NIP entry (OpBloqueo): four dots, the wrong-NIP line, the keypad. */
export function NipPad(p: {
  readonly nip: string;
  readonly error: boolean;
  readonly onKey: (k: Tecla) => void;
  /** The keypad's last key: «Desbloquear» or «Entrar como …». */
  readonly accion: ReactNode;
}): ReactNode {
  return (
    <>
      <div className={b.nipHead}>
        <span>Pon tu NIP para seguir</span>
        <span className={b.nipAyuda}>Cuatro números</span>
      </div>
      <Puntos n={p.nip.length} />
      {p.error ? (
        <p className={b.error} role="alert" data-testid="bloqueo-error">
          NIP incorrecto. Vuelve a intentarlo.
        </p>
      ) : null}
      <div className={b.teclado}>
        {DIGITOS.map((k) => (
          <Tecla key={k} k={k} onKey={p.onKey} />
        ))}
        <Borrar onKey={p.onKey} />
        <Tecla k="0" onKey={p.onKey} />
        {p.accion}
      </div>
    </>
  );
}

/** The keypad's last key: yellow once the four numbers are in. */
export function Entrar(p: {
  readonly listo: boolean;
  readonly label: string;
  readonly onEntrar: () => void;
}) {
  return (
    <button
      type="button"
      className={b.tecla}
      data-entrar=""
      disabled={!p.listo}
      data-testid="bloqueo-entrar"
      onClick={p.onEntrar}
    >
      {p.label}
    </button>
  );
}

function Borrar({ onKey }: { readonly onKey: (k: Tecla) => void }) {
  return (
    <button
      type="button"
      className={b.tecla}
      data-borrar=""
      aria-label="Borrar el último número"
      data-testid="bloqueo-tecla-⌫"
      onClick={() => onKey('⌫')}
    >
      <svg
        viewBox="0 0 24 24"
        width={22}
        height={22}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {BORRAR.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
      Borrar
    </button>
  );
}

function Puntos({ n }: { readonly n: number }) {
  return (
    <div
      className={b.puntos}
      role="img"
      aria-label={`${n} de 4 números escritos`}
      data-testid="bloqueo-nip"
    >
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={b.punto} data-lleno={i < n ? '' : undefined} />
      ))}
    </div>
  );
}

function Tecla(p: { readonly k: Tecla; readonly onKey: (k: Tecla) => void }) {
  return (
    <button
      type="button"
      className={b.tecla}
      data-testid={`bloqueo-tecla-${p.k}`}
      onClick={() => p.onKey(p.k)}
    >
      {p.k}
    </button>
  );
}

export function teclaDe(
  setNip: (v: string) => void,
  nip: string,
  onOk: () => void,
): (k: Tecla) => void {
  return (k) => {
    if (k === '⌫') return setNip(nip.slice(0, -1));
    if (k === 'OK') return void onOk();
    setNip(nip.length >= 4 ? nip : nip + k);
  };
}

/** A keyboard on the register types the NIP too: digits, Backspace, Enter. */
export function useTeclado(onKey: (k: Tecla) => void): void {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'Enter' && e.target instanceof HTMLButtonElement) return;
      if (/^\d$/.test(e.key)) onKey(e.key as Tecla);
      else if (e.key === 'Backspace') onKey('⌫');
      else if (e.key === 'Enter') onKey('OK');
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onKey]);
}

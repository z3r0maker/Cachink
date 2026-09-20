'use client';

import type { ReactNode } from 'react';

import * as a from '../acceso/acceso.css';

export const BLOQUEO_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'] as const;

/** The lock's NIP entry: four boxes, the wrong-NIP line, the keypad. */
export function NipPad(p: {
  readonly nip: string;
  readonly error: boolean;
  readonly onKey: (k: (typeof BLOQUEO_KEYS)[number]) => void;
}): ReactNode {
  return (
    <>
      <div className={a.nipBoxes} data-testid="bloqueo-nip">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={a.nipBox}>
            {p.nip[i] ?? ''}
          </span>
        ))}
      </div>
      {p.error ? (
        <p className={a.error} data-testid="bloqueo-error">
          NIP incorrecto. Vuelve a intentarlo.
        </p>
      ) : null}
      <div className={a.keypad}>
        {BLOQUEO_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={a.key}
            data-testid={`bloqueo-tecla-${k}`}
            onClick={() => p.onKey(k)}
          >
            {k}
          </button>
        ))}
      </div>
    </>
  );
}

export function teclaDe(
  setNip: (v: string) => void,
  nip: string,
  onOk: () => void,
): (k: (typeof BLOQUEO_KEYS)[number]) => void {
  return (k) => {
    if (k === '⌫') return setNip(nip.slice(0, -1));
    if (k === 'OK') return void onOk();
    setNip(nip.length >= 4 ? nip : nip + k);
  };
}

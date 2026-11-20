'use client';

import { browserSupportsWebAuthn, startAuthentication } from '@simplewebauthn/browser';
import { useEffect, useState } from 'react';

import { Notice } from '@/components/trastienda/notice';
import * as c from '@/components/trastienda/controls.css';
import { KeyIcon } from '@/components/trastienda/icons';
import { useDonCuentas, type Mood } from '@/components/trastienda/trastienda';
import { entrarConLlave, opcionesEntrada, type EntradaState } from '@/server/actions/auth';
import { muted } from '@/styles/ui.css';

type Estado =
  | { readonly kind: 'lista' | 'esperando' | 'cancelada' | 'rechazada' | 'sin-soporte' }
  | Exclude<EntradaState, { kind: 'opciones' | 'rechazada' }>;

const MOODS: Readonly<Record<Estado['kind'], Mood>> = {
  lista: 'idle',
  esperando: 'esperando',
  cancelada: 'cancelada',
  rechazada: 'rechazada',
  bloqueada: 'bloqueada',
  error: 'rechazada',
  'sin-soporte': 'cancelada',
};

function Aviso({ estado }: { readonly estado: Estado }) {
  switch (estado.kind) {
    case 'cancelada':
      return (
        <Notice tone="aviso" title="No se usó ninguna llave.">
          Cerraste la ventana o este equipo no tiene tu llave. Intenta otra vez; si tu llave está en
          tu teléfono, elige «Usar un teléfono».
        </Notice>
      );
    case 'rechazada':
      return (
        <Notice tone="error" title="Esa llave no abre esta puerta.">
          No es una llave del equipo, o ya se quitó. Si acabas de cambiar de equipo, pídele a tu
          socio un enlace para registrar una llave nueva.
        </Notice>
      );
    case 'bloqueada':
      return (
        <Notice tone="error" title="Demasiados intentos desde esta red.">
          Intenta de nuevo en {estado.minutos} {estado.minutos === 1 ? 'minuto' : 'minutos'}.
        </Notice>
      );
    case 'error':
      return (
        <Notice tone="error" title="No pudimos revisar tu llave.">
          {estado.message}
        </Notice>
      );
    case 'sin-soporte':
      return (
        <Notice tone="aviso" title="Este navegador no maneja llaves de acceso.">
          Abre la consola en Safari, Chrome, Edge o Firefox recientes.
        </Notice>
      );
    default:
      return null;
  }
}

/** Options, the browser's own prompt, the answer: the three steps of board CD-20. */
async function entrar(set: (e: Estado) => void): Promise<void> {
  if (!browserSupportsWebAuthn()) return set({ kind: 'sin-soporte' });
  set({ kind: 'esperando' });
  const started = await opcionesEntrada();
  if (started.kind !== 'opciones') return set(started);
  let answer;
  try {
    answer = await startAuthentication({ optionsJSON: started.options });
  } catch {
    // NotAllowedError: the person closed the prompt, or this device has no key.
    return set({ kind: 'cancelada' });
  }
  // On success the action sets the cookie and redirects to the console.
  set(await entrarConLlave(answer));
}

export function Entrada() {
  const [estado, setEstado] = useState<Estado>({ kind: 'lista' });
  const setMood = useDonCuentas();
  useEffect(() => setMood(MOODS[estado.kind]), [estado.kind, setMood]);

  const waiting = estado.kind === 'esperando';
  const disabled = waiting || estado.kind === 'bloqueada';
  return (
    <>
      <Aviso estado={estado} />
      <button
        className={c.cta}
        type="button"
        disabled={disabled}
        onClick={() => void entrar(setEstado)}
      >
        <KeyIcon />
        {waiting ? 'Esperando tu llave…' : 'Entrar con mi llave'}
      </button>
      {waiting ? (
        <p className={c.hint}>
          Tu navegador abre su propia ventana para pedirte Face ID, Touch ID o el PIN de este
          equipo. Si tu llave vive en tu teléfono, elige «Usar un teléfono» y escanea el código que
          te muestra.
        </p>
      ) : null}
      <p className={muted}>
        ¿Eres nuevo o perdiste todas tus llaves? Tu socio te genera un enlace para registrar una
        llave nueva.
      </p>
    </>
  );
}

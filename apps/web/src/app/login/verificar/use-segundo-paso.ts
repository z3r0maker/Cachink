'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { verificarSegundoPaso } from '@/server/actions/segundo-paso';

import { useCortina } from '../cortina';
import { rutaDeDueno } from '../puertas';

export type Modo = 'app' | 'recuperacion' | 'ayuda';

/** Where a recovery-code sign-in lands: Hoy, with the notice that one code is gone. */
const CON_AVISO = '/?aviso=recuperacion';

/**
 * Step 2 of 2. The code opens the session; a wrong one stays on the field, a
 * lock closes it, and a challenge that is gone goes back to the password.
 */
export function useSegundoPaso() {
  const [modo, setModo] = useState<Modo>('app');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { set } = useCortina();

  // The shutter follows the step, as it follows the password form.
  useEffect(() => {
    set(pending ? 'abriendo' : error === null ? 'lista' : 'error');
  }, [pending, error, set]);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await verificarSegundoPaso(codigo);
      if (!r.ok) {
        if (r.sinReto) return router.replace(rutaDeDueno);
        setBloqueado(r.bloqueado === true);
        return setError(r.message);
      }
      router.replace(r.restantes === null ? '/' : CON_AVISO);
      router.refresh();
    });
  };
  const cambiar = (next: Modo) => {
    setModo(next);
    setCodigo('');
    if (!bloqueado) setError(null);
  };
  const escribir = (value: string) => {
    setCodigo(value);
    if (!bloqueado) setError(null);
  };
  return { modo, codigo, error, bloqueado, pending, enviar, cambiar, escribir };
}

export type Paso = ReturnType<typeof useSegundoPaso>;

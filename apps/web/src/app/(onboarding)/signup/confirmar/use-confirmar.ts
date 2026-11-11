'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { rutaSiguiente } from '@/lib/acceso-rutas';
import { confirmarCorreo, reenviarEnlaceVencido } from '@/server/actions/confirmar-correo';

import { planElegido } from '../plan-elegido';

/**
 * The confirmation page's one tap. On success the session exists; a fresh
 * account goes on to the wizard (with the plan it picked on the landing, if
 * this is the browser that signed up), and anything else follows `next`.
 */
export function useConfirmar(token: string) {
  const [error, setError] = useState<string | null>(null);
  /** What the link turned out to be when the tap found it no good. */
  const [estado, setEstado] = useState<'vencido' | 'usado' | 'desconocido' | null>(null);
  /** Where «Seguir» goes once the address is confirmed. */
  const [siguiente, setSiguiente] = useState<string | null>(null);
  const [reenviado, setReenviado] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const confirmar = () =>
    startTransition(async () => {
      const r = await confirmarCorreo(token);
      if (!r.ok) {
        if ('estado' in r) return setEstado(r.estado);
        return setError(r.message);
      }
      const plan = planElegido.leer();
      const bienvenida = plan === null ? '/bienvenida' : `/bienvenida?plan=${plan}`;
      if (r.next === 'portal') {
        planElegido.olvidar();
        return setSiguiente(bienvenida);
      }
      router.replace(rutaSiguiente(r));
      router.refresh();
    });

  const pedirOtro = () =>
    startTransition(async () => {
      const r = await reenviarEnlaceVencido(token);
      if (!r.ok) return setError(r.message);
      setError(null);
      setReenviado(true);
    });

  return { error, estado, siguiente, reenviado, pending, confirmar, pedirOtro };
}

export type Confirmar = ReturnType<typeof useConfirmar>;

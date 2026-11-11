'use client';

import { useEffect, useState, useTransition } from 'react';

import { pareceCorreo } from '@/lib/correo';
import { corregirCorreo, reenviarConfirmacion } from '@/server/actions/confirmar-correo';

/** What the card says back: sent, a wait, or a fault. Never colour alone: the banner carries words. */
export interface Aviso {
  readonly tono: 'success' | 'warning' | 'critical';
  readonly texto: string;
}

const REENVIADO = 'Listo, te mandamos otro enlace. El anterior ya no sirve.';
/** After a send the button rests a minute, so a double tap is not two emails. */
const ESPERA_MS = 60_000;

const refused = (r: { readonly message: string; readonly limite?: true }): Aviso => ({
  tono: r.limite ? 'warning' : 'critical',
  texto: r.message,
});

/** True for a minute after `empezar()`. */
function useEspera() {
  const [enEspera, setEnEspera] = useState(false);
  useEffect(() => {
    if (!enEspera) return;
    const timer = setTimeout(() => setEnEspera(false), ESPERA_MS);
    return () => clearTimeout(timer);
  }, [enEspera]);
  return { enEspera, empezar: () => setEnEspera(true) };
}

/** The address on screen and the draft being corrected. */
function useCorreo(inicial: string) {
  const [email, setEmail] = useState(inicial);
  const [borrador, setBorrador] = useState(inicial);
  const [editando, setEditando] = useState(false);
  return { email, setEmail, borrador, setBorrador, editando, setEditando };
}

/**
 * «Revisa tu correo»: resend, and correct the address. Both act through the
 * pending pass in the browser's cookie; this hook holds only what is on screen.
 */
export function useRevisa(inicial: string) {
  const c = useCorreo(inicial);
  const espera = useEspera();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [pending, startTransition] = useTransition();

  const enviado = () => {
    espera.empezar();
    setAviso({ tono: 'success', texto: REENVIADO });
  };
  const reenviar = () =>
    startTransition(async () => {
      const r = await reenviarConfirmacion();
      if (!r.ok) return setAviso(refused(r));
      enviado();
    });
  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await corregirCorreo(c.borrador);
      if (!r.ok) return setAviso(refused(r));
      c.setEmail(r.email);
      c.setEditando(false);
      enviado();
    });
  };
  const editar = () => {
    c.setBorrador(c.email);
    setAviso(null);
    c.setEditando(true);
  };
  return {
    ...{ email: c.email, borrador: c.borrador, setBorrador: c.setBorrador, editando: c.editando },
    ...{ aviso, enEspera: espera.enEspera, pending, reenviar, guardar, editar },
    cancelar: () => c.setEditando(false),
    borradorValido: pareceCorreo(c.borrador.trim()),
  };
}

export type Revisa = ReturnType<typeof useRevisa>;

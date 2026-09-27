'use client';

import { ChevronLeft, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';

import { Button, Input } from '@/components';
import { pedirEnlace } from '@/server/actions/auth-links';

import { enlace, pila } from '../../_publico/publico.css';
import { rutaDeDueno } from '../puertas';
import * as s from './recuperar.css';
import { TarjetaAcceso } from './tarjeta';

/** `pedro@taqueria.mx` → `p***@taqueria.mx`: the receipt names the inbox, not the person. */
function enmascarar(correo: string): string {
  const [usuario = '', dominio = ''] = correo.trim().toLowerCase().split('@');
  return dominio === '' ? usuario : `${usuario.charAt(0)}***@${dominio}`;
}

/**
 * Ask for a reset link (ADR-080). The confirmation reads the same whether or
 * not the address has an account — that is the action's promise, and the
 * screen does not undo it.
 */
function useRecuperar() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await pedirEnlace(email, 'reset');
      if (!r.ok) return setError(r.message);
      setSent(true);
    });
  };
  const onEmail = (v: string) => {
    setEmail(v);
    setError(null);
  };
  const otro = () => {
    setSent(false);
    setEmail('');
  };
  return { email, onEmail, error, sent, pending, submit, otro };
}

function Enviado({ email, otro }: { readonly email: string; readonly otro: () => void }) {
  return (
    <div className={pila} role="status" data-testid="link-sent">
      <div className={s.enviado}>
        <Mail size={22} aria-hidden="true" />
        <p className={s.enviadoTexto}>
          Te mandamos un enlace a <strong className={s.correo}>{enmascarar(email)}</strong> si tiene
          cuenta. Dura 30 minutos.
        </p>
      </div>
      <p className={s.aparte}>
        ¿No llega? Revisa también tu carpeta de spam o pide otro en unos minutos.
      </p>
      <Button variant="secondary" onClick={otro} full>
        Usar otro correo
      </Button>
    </div>
  );
}

export function RecuperarForm() {
  const f = useRecuperar();
  return (
    <TarjetaAcceso
      icono={<KeyRound size={24} />}
      titulo="Recupera tu contraseña"
      bajada={f.sent ? undefined : 'Te mandamos un enlace para crear una nueva. Dura 30 minutos.'}
    >
      {f.sent ? (
        <Enviado email={f.email} otro={f.otro} />
      ) : (
        <form onSubmit={f.submit} noValidate className={s.form}>
          <Input
            labelText="Correo"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.mx"
            value={f.email}
            onChange={(ev) => f.onEmail(ev.target.value)}
            error={f.error ?? undefined}
            data-testid="link-email"
          />
          <Button type="submit" size="lg" full disabled={f.pending}>
            {f.pending ? 'Mandando…' : 'Mandar enlace'}
          </Button>
        </form>
      )}
      <Link className={enlace} href={rutaDeDueno}>
        <ChevronLeft size={16} strokeWidth={2.6} aria-hidden="true" />
        Volver a entrar con contraseña
      </Link>
    </TarjetaAcceso>
  );
}

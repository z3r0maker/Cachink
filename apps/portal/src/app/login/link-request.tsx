'use client';

import { useState, useTransition } from 'react';

import { Button, Input } from '@/components';
import { pedirEnlace, type LinkKind } from '@/server/actions/auth-links';

import { AuthCard } from './auth-card';

const COPY = {
  reset: {
    title: 'Recupera tu contraseña',
    body: 'Te mandamos un enlace para crear una nueva. Dura 30 minutos.',
    cta: 'Mandar enlace',
  },
  magic: {
    title: 'Entra sin contraseña',
    body: 'Te mandamos un enlace para entrar con un toque. Dura 15 minutos.',
    cta: 'Mandar enlace',
  },
} as const;

/**
 * Ask for a reset or sign-in link (ADR-080). The confirmation reads the same
 * whether or not the address has an account — that is the action's promise,
 * and the screen does not undo it.
 */
function useLinkRequest(kind: LinkKind) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await pedirEnlace(email, kind);
      if (!r.ok) return setError(r.message);
      setSent(true);
    });
  };
  const onEmail = (v: string) => {
    setEmail(v);
    setError(null);
  };
  return { email, onEmail, error, sent, pending, submit };
}

export function LinkRequestForm({ kind }: { readonly kind: LinkKind }) {
  const f = useLinkRequest(kind);
  const copy = COPY[kind];
  return (
    <AuthCard title={copy.title} back={{ href: '/login', label: 'Volver a entrar con contraseña' }}>
      {f.sent ? (
        <p data-testid="link-sent">
          Si <strong>{f.email.trim().toLowerCase()}</strong> tiene cuenta, ya va en camino el
          enlace. Revisa también tu carpeta de spam.
        </p>
      ) : (
        <form onSubmit={f.submit} noValidate>
          <p>{copy.body}</p>
          <Input
            labelText="Correo"
            type="email"
            autoComplete="email"
            value={f.email}
            onChange={(ev) => f.onEmail(ev.target.value)}
            error={f.error ?? undefined}
            data-testid="link-email"
          />
          <Button type="submit" disabled={f.pending}>
            {f.pending ? 'Mandando…' : copy.cta}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

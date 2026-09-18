'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button, Input } from '@/components';
import { restablecerContrasena } from '@/server/actions/auth-links';

import { AuthCard } from '../auth-card';

/** New password; saving it spends the link, ends every other session and signs in. */
export function ResetForm({ token }: { readonly token: string }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await restablecerContrasena(token, password);
      if (!r.ok) return setError(r.message);
      router.replace('/');
      router.refresh();
    });
  };

  return (
    <AuthCard
      title="Crea una contraseña nueva"
      back={{ href: '/login/recuperar', label: 'Pedir otro enlace' }}
    >
      <form onSubmit={submit} noValidate>
        <Input
          labelText="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          hintText="Mínimo 8 caracteres. Se cerrarán tus otras sesiones."
          value={password}
          onChange={(ev) => {
            setPassword(ev.target.value);
            setError(null);
          }}
          error={error ?? undefined}
          data-testid="reset-password"
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar y entrar'}
        </Button>
      </form>
    </AuthCard>
  );
}

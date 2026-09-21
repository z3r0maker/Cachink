'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button, Input } from '@/components';
import { login } from '@/server/actions/auth';

import { AuthCard } from './auth-card';

interface FieldsProps {
  readonly email: string;
  readonly password: string;
  readonly error: string | null;
  readonly onEmail: (v: string) => void;
  readonly onPassword: (v: string) => void;
}

/** The error hangs off the password field: it is about the pair, not the email. */
function Fields({ email, password, error, onEmail, onPassword }: FieldsProps) {
  return (
    <>
      <Input
        labelText="Correo"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(ev) => onEmail(ev.target.value)}
        data-testid="login-email"
      />
      <Input
        labelText="Contraseña"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(ev) => onPassword(ev.target.value)}
        error={error ?? undefined}
        data-testid="login-password"
      />
    </>
  );
}

function useLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    startTransition(async () => {
      const result = await login(email, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      // `refresh` as well as `replace`: the layout is a server component and
      // has already rendered without a session, so the client cache holds a
      // signed-out tree.
      router.replace('/');
      router.refresh();
    });
  }

  return { email, setEmail, password, setPassword, error, setError, pending, submit };
}

export function LoginForm({
  backTo,
}: {
  /** Where the door chooser sends the member back to. */
  readonly backTo?: { readonly href: string; readonly label: string };
}) {
  const { email, setEmail, password, setPassword, error, setError, pending, submit } = useLogin();

  return (
    <AuthCard title="Entra a tu portal" back={backTo}>
      <form onSubmit={submit} noValidate>
        <Fields
          email={email}
          password={password}
          error={error}
          onEmail={(v) => {
            setEmail(v);
            setError(null);
          }}
          onPassword={(v) => {
            setPassword(v);
            setError(null);
          }}
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      {/* ADR-080: our own emailed links, no auth vendor. */}
      <p style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/login/recuperar">¿Olvidaste tu contraseña?</Link>
        <Link href="/login/enlace">Entrar con un enlace por correo</Link>
      </p>
    </AuthCard>
  );
}

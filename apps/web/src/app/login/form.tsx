'use client';

import Link from 'next/link';

import { AVISO_INTEGRAL_URL } from '@/legal/aviso-simplificado';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { Button, Input, MonedaGirando } from '@/components';
import { login } from '@/server/actions/auth';

import { AuthCard } from './auth-card';
import { useCortina, type Etapa } from './cortina';

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

/** How far the panel's shutter is up for what the form holds right now. */
function etapaDe(email: string, password: string, pending: boolean, error: string | null): Etapa {
  if (pending) return 'abriendo';
  if (error !== null) return 'error';
  if (!/.+@.+\..+/.test(email.trim())) return 'dueno';
  return password === '' ? 'correo' : 'lista';
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

/** While the form posts, a coin spins beside the words (ADR-107). */
function SubmitLabel({ pending }: { readonly pending: boolean }) {
  if (!pending) return <>Abrir mi changarro</>;
  return (
    <>
      <MonedaGirando /> Subiendo la cortina…
    </>
  );
}

export function LoginForm({
  backTo,
}: {
  /** Where the door chooser sends the member back to. */
  readonly backTo?: { readonly href: string; readonly label: string };
}) {
  const { email, setEmail, password, setPassword, error, setError, pending, submit } = useLogin();
  const { set } = useCortina();
  useEffect(() => {
    set(etapaDe(email, password, pending, error));
  }, [email, password, pending, error, set]);

  return (
    <AuthCard title="Sube la cortina." back={backTo}>
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
        <Button type="submit" full disabled={pending}>
          <SubmitLabel pending={pending} />
        </Button>
      </form>
      {/* ADR-080: our own emailed links, no auth vendor. */}
      <p style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/login/recuperar">¿Olvidaste tu contraseña?</Link>
        <Link href="/login/enlace">Entrar con un enlace por correo</Link>
        <a href={AVISO_INTEGRAL_URL}>Aviso de privacidad</a>
      </p>
    </AuthCard>
  );
}

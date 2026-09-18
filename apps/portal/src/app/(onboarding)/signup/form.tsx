'use client';

import type { PlanId } from '@xangarro/domain';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Banner, Button, Card, Input } from '@/components';
import { OnboardingFrame } from '@/onboarding/ui/frame';
import { link, note, stack } from '@/onboarding/ui/onboarding.css';
import { registrarse, type SignupFields } from '@/server/actions/signup';

/** Three fields, one button. Everything else is asked by the wizard. */
function useSignup(plan: PlanId | null) {
  const [fields, setFields] = useState<SignupFields>({ nombre: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const set = (patch: Partial<SignupFields>) => {
    setFields((f) => ({ ...f, ...patch }));
    setError(null);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await registrarse(fields);
      if (!r.ok) return setError(r.message);
      router.replace(plan === null ? '/bienvenida' : `/bienvenida?plan=${plan}`);
      router.refresh();
    });
  };
  return { fields, set, error, pending, submit };
}

function Fields({ s }: { readonly s: ReturnType<typeof useSignup> }) {
  return (
    <>
      <Input
        labelText="Nombre de tu negocio"
        autoComplete="organization"
        value={s.fields.nombre}
        onChange={(e) => s.set({ nombre: e.target.value })}
        data-testid="signup-nombre"
      />
      <Input
        labelText="Correo"
        type="email"
        autoComplete="email"
        value={s.fields.email}
        onChange={(e) => s.set({ email: e.target.value })}
        data-testid="signup-email"
      />
      <Input
        labelText="Contraseña"
        type="password"
        autoComplete="new-password"
        hintText="Mínimo 8 caracteres."
        value={s.fields.password}
        onChange={(e) => s.set({ password: e.target.value })}
        data-testid="signup-password"
      />
    </>
  );
}

export function SignupForm({ plan }: { readonly plan: PlanId | null }) {
  const s = useSignup(plan);
  return (
    <OnboardingFrame title="Crea tu negocio" subtitle="Gratis. Sin tarjeta.">
      <Card>
        <form onSubmit={s.submit} noValidate className={stack}>
          <Fields s={s} />
          {s.error ? <Banner tone="critical" title={s.error} /> : null}
          <Button type="submit" disabled={s.pending} full>
            {s.pending ? 'Creando tu cuenta…' : 'Crear cuenta'}
          </Button>
          <p className={note}>
            ¿Ya tienes cuenta?{' '}
            <a className={link} href="/login">
              Entra aquí
            </a>
          </p>
        </form>
      </Card>
    </OnboardingFrame>
  );
}

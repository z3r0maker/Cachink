'use client';

import type { PlanId } from '@xangarro/domain';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import type { Utm } from '@/server/attribution/utm';
import { registrarse, type SignupFields } from '@/server/actions/signup';

import type { ConsentState } from './consent';

const SIN_CONSENTIMIENTO = 'Para crear tu cuenta, acepta el aviso de privacidad y los Términos.';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** «el nombre de tu negocio, un correo válido y …»: what the button still needs. */
export function loQueFalta(fields: SignupFields, acepto: boolean): string | null {
  const faltan: string[] = [];
  if (fields.nombre.trim() === '') faltan.push('el nombre de tu negocio');
  if (!CORREO.test(fields.email.trim())) faltan.push('un correo válido');
  if (fields.password.length < 8) faltan.push('una contraseña de 8 caracteres');
  if (!acepto) faltan.push('aceptar el aviso y los Términos');
  if (faltan.length === 0) return null;
  const ultimo = faltan.pop() as string;
  const lista = faltan.length === 0 ? ultimo : `${faltan.join(', ')} y ${ultimo}`;
  return `Para seguir falta ${lista}.`;
}

/**
 * Four fields, the aviso, one button. Everything else is asked by the wizard.
 * The button stays pressable: the consent and the password rules are the
 * server's to enforce, and the form says why when it refuses.
 */
export function useSignup(plan: PlanId | null, utm: Utm) {
  const [fields, setFields] = useState<SignupFields>({
    nombre: '',
    tuNombre: '',
    email: '',
    password: '',
  });
  const [consent, setConsent] = useState<ConsentState>({ acepto: false, novedades: true });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const set = (patch: Partial<SignupFields>) => {
    setFields((f) => ({ ...f, ...patch }));
    setError(null);
  };
  const setC = (patch: Partial<ConsentState>) => {
    setConsent((c) => ({ ...c, ...patch }));
    setError(null);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent.acepto) return setError(SIN_CONSENTIMIENTO);
    startTransition(async () => {
      const r = await registrarse({ ...fields, utm, consentimiento: consent });
      if (!r.ok) return setError(r.message);
      router.replace(plan === null ? '/bienvenida' : `/bienvenida?plan=${plan}`);
      router.refresh();
    });
  };
  const falta = loQueFalta(fields, consent.acepto);
  return { fields, set, consent, setC, error, pending, submit, falta };
}

export type Signup = ReturnType<typeof useSignup>;

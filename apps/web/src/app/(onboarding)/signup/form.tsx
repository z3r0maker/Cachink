'use client';

import type { PlanId } from '@xangarro/domain';
import { Check } from 'lucide-react';
import Link from 'next/link';

import { Banner, Button, Card } from '@/components';
import type { Utm } from '@/server/attribution/utm';

import { MarcoPublico } from '../../_publico/marco';
import { item, lista, punto } from '../../_publico/marco.css';
import * as p from '../../_publico/publico.css';
import { Campos } from './campos';
import { Consent } from './consent';
import { useSignup, type Signup } from './use-signup';

const PROMESAS = ['Gratis para siempre', 'Sin tarjeta', 'En español y en pesos'] as const;

function Promesas() {
  return (
    <ul className={lista}>
      {PROMESAS.map((t) => (
        <li key={t} className={item}>
          <span className={punto} aria-hidden="true">
            <Check size={16} strokeWidth={3.2} />
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

function Envio({ s }: { readonly s: Signup }) {
  return (
    <>
      {s.error ? <Banner tone="critical" title={s.error} /> : null}
      <Button
        type="submit"
        size="lg"
        disabled={s.pending}
        full
        aria-describedby={s.falta ? 'signup-falta' : undefined}
      >
        {s.pending ? 'Creando tu cuenta…' : 'Crear mi cuenta'}
      </Button>
      {s.falta ? (
        <p id="signup-falta" className={p.falta}>
          {s.falta}
        </p>
      ) : null}
      <p className={p.pieTexto}>
        ¿Ya tienes cuenta?
        <Link className={p.enlace} href="/login">
          Entra aquí
        </Link>
      </p>
    </>
  );
}

export function SignupForm({
  plan,
  utm,
}: {
  readonly plan: PlanId | null;
  /** N-57: the campaign that brought them, returned with the signup. */
  readonly utm: Utm;
}) {
  const s = useSignup(plan, utm);
  return (
    <MarcoPublico
      pose="hola"
      titulo="Abre tu changarro."
      bajada="Tus ventas, tu caja y tus estados financieros en un solo lugar. Finanzas para emprendedores."
      extra={<Promesas />}
    >
      <div className={`${p.zona} ${p.ancho.medio}`}>
        <header className={p.cabeza}>
          <h1 className={p.titulo}>Crea tu negocio</h1>
          <p className={p.bajada}>Gratis, sin tarjeta. Lo demás te lo preguntamos después.</p>
        </header>
        <Card emphasis="hero">
          <form onSubmit={s.submit} noValidate className={p.pila}>
            <Campos s={s} />
            <Consent value={s.consent} onChange={s.setC} />
            <Envio s={s} />
          </form>
        </Card>
      </div>
    </MarcoPublico>
  );
}

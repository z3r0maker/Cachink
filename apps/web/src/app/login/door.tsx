'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Icon } from '@/shell/icon';

import { useCortina } from './cortina';
import * as s from './door.css';
import { rutaDeDueno } from './puertas';

/**
 * The login's two doors. Choosing one grants nothing — the owner still types
 * a password, and the caja still needs its device link and NIP (ADR-071) —
 * it only routes. What it buys is a map: the person at the counter never
 * meets a form that was never for them, and the owner does not have to know
 * that `/operador` exists. Hovering a door lifts the shutter a crack.
 */

/** Lucide `store`: the business the owner runs. */
const OWNER_ICON =
  'm2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-2-1 2.7 2.7 0 0 1-4 0 2.7 2.7 0 0 1-4 0 2.7 2.7 0 0 1-4 0 2.7 2.7 0 0 1-2 1 2 2 0 0 1-2-2V7';

/** Lucide `receipt`: the ticket the cashier tears off. */
const CAJA_ICON =
  'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1ZM16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11';

const ARROW = 'M5 12h14M13 6l6 6-6 6';

interface PuertaProps {
  readonly testId: string;
  readonly icon: string;
  readonly placa: string;
  readonly title: string;
  readonly body: string;
  readonly cta: string;
  readonly onOpen: () => void;
}

function Puerta({ testId, icon, placa, title, body, cta, onOpen }: PuertaProps) {
  const { set } = useCortina();
  const asomar = () => set('asomo');
  const soltar = () => set('cerrada');
  return (
    <button
      type="button"
      className={s.puerta}
      data-testid={testId}
      onClick={onOpen}
      onMouseEnter={asomar}
      onMouseLeave={soltar}
      onFocus={asomar}
      onBlur={soltar}
    >
      <span className={placa}>
        <Icon path={icon} size={30} strokeWidth={2.3} />
      </span>
      <span className={s.puertaTitulo}>{title}</span>
      <span className={s.puertaCuerpo}>{body}</span>
      <span className={s.puertaPie}>
        {cta} <Icon path={ARROW} size={18} strokeWidth={2.6} />
      </span>
    </button>
  );
}

/**
 * Which door is open lives in the URL, not in component state: «‹ Volver»
 * and the browser's Back both need something to undo.
 */
export function LoginDoor() {
  const router = useRouter();
  const { set } = useCortina();
  useEffect(() => set('cerrada'), [set]);

  return (
    <div className={s.zona}>
      <div className={s.encabezado}>
        <h1 className={s.titulo}>¿Cómo vas a entrar?</h1>
        <p className={s.bajada}>Cada quien entra por su puerta.</p>
      </div>
      <div className={s.puertas}>
        <Puerta
          testId="login-door-owner"
          icon={OWNER_ICON}
          placa={s.placa}
          title="Soy el dueño o administrador"
          body="Ventas, estados financieros, equipo y suscripción."
          cta="Entrar al portal"
          onOpen={() => router.push(rutaDeDueno)}
        />
        <Puerta
          testId="login-door-caja"
          icon={CAJA_ICON}
          placa={s.placaCaja}
          title="Trabajo en la caja"
          body="Cobro, registro gastos y cierro mi turno."
          cta="Ir a la caja"
          onOpen={() => router.push('/operador')}
        />
      </div>
      <Link href="/signup" className={s.registro}>
        <span>
          ¿Aún no tienes cuenta? <strong>Créala gratis</strong>
        </span>
        <Icon path={ARROW} size={20} strokeWidth={2.6} />
      </Link>
    </div>
  );
}

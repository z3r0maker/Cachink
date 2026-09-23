'use client';

import { useRouter } from 'next/navigation';

import { group, option, optionBody, optionTitle } from '@/components/option-card.css';
import { Icon } from '@/shell/icon';

import { AuthCard } from './auth-card';
import { rutaDeDueno } from './puertas';

/**
 * The login's two doors. Choosing one grants nothing — the owner still types
 * a password, and the caja still needs its device link and NIP (ADR-071) —
 * it only routes. What it buys is a map: the person at the counter never
 * meets a form that was never for them, and the owner does not have to know
 * that `/operador` exists. Icon+description cards per CLAUDE.md §6.
 */

/** The Negocio nav glyph: the house the owner runs. */
const OWNER_ICON = 'M4 9h16v11H4V9Zm0 0 2-5h12l2 5M9 20v-6h6v6';

/** The Ventas nav glyph: the receipt the cashier tears off. */
const CAJA_ICON = 'M5 3h14v18l-3-2-2 2-2-2-2 2-3-2V3M9 8h6M9 12h6';

/**
 * Which door is open lives in the URL, not in component state.
 *
 * It was `useState` once, and «‹ Volver» linked to `/login` — the address the
 * visitor was already at. Next had nothing to change, so the form stayed up
 * and the way back was a dead control. The browser's own Back button was dead
 * for the same reason: choosing a door left no history behind it.
 */
export function LoginDoor() {
  const router = useRouter();

  return (
    <AuthCard title="¿Cómo vas a entrar?">
      <p style={{ marginTop: 0 }}>Cada quien entra por su puerta.</p>
      <div className={group}>
        <button
          type="button"
          className={option}
          data-testid="login-door-owner"
          onClick={() => router.push(rutaDeDueno)}
        >
          <Icon path={OWNER_ICON} size={24} />
          <span>
            <span className={optionTitle}>Soy el dueño o administrador</span>
            <span className={optionBody}>Ventas, estados financieros, equipo y suscripción.</span>
          </span>
        </button>
        <button
          type="button"
          className={option}
          data-testid="login-door-caja"
          onClick={() => router.push('/operador')}
        >
          <Icon path={CAJA_ICON} size={24} />
          <span>
            <span className={optionTitle}>Trabajo en la caja</span>
            <span className={optionBody}>Cobro, registro gastos y cierro mi turno.</span>
          </span>
        </button>
      </div>
    </AuthCard>
  );
}

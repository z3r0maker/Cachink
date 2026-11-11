'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { RUTA_SEGURIDAD } from '@/lib/acceso-rutas';
import { descartarInvitacion } from '@/server/actions/seguridad';

import * as s from './aviso-nuevo.css';

/**
 * The two strips of the second factor (N-83, board SgMenu), drawn like the
 * privacy one above every portal page and never on «Seguridad» itself.
 *
 * - The invitation, once per person: «Ahora no» is remembered on the server,
 *   so it does not come back on another device.
 * - The notice after a sign-in with a recovery code: that code is spent, and
 *   the count is read from the account, not from the address bar.
 */
export function InvitacionFranja({ visible }: { readonly visible: boolean }) {
  const path = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (!visible || path.startsWith(RUTA_SEGURIDAD)) return null;
  const ahoraNo = () =>
    startTransition(async () => {
      await descartarInvitacion();
      router.refresh();
    });
  return (
    <aside className={s.franja} aria-label="Seguridad" data-testid="seguridad-invitacion">
      <span className={s.texto}>
        Ponle un segundo paso a tu cuenta: además de tu contraseña, un código de tu teléfono.
      </span>
      <Link href={RUTA_SEGURIDAD} className={s.boton}>
        Activar
      </Link>
      <button type="button" className={s.botonQuieto} onClick={ahoraNo} disabled={pending}>
        Ahora no
      </button>
    </aside>
  );
}

/** `?aviso=recuperacion` is where step two sends a recovery-code sign-in (`/login/verificar`). */
export function RecuperacionFranja({ codigos }: { readonly codigos: number | null }) {
  const params = useSearchParams();
  if (codigos === null || params.get('aviso') !== 'recuperacion') return null;
  return (
    <aside className={s.franja} aria-label="Seguridad" data-testid="seguridad-recuperacion">
      <span className={s.texto}>
        Entraste con un código de recuperación. Ese ya no sirve: te quedan {codigos} de 10.
      </span>
      <Link href={RUTA_SEGURIDAD} className={s.boton}>
        Ver Seguridad
      </Link>
    </aside>
  );
}

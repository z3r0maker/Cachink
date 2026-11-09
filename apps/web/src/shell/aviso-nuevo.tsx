'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import * as s from './aviso-nuevo.css';

/**
 * «Actualizamos el aviso de privacidad» (PvMenu, ADR-137): a quiet strip above
 * every portal page until the account accepts the current aviso. Not on the
 * privacy page itself, which shows the full card. Not a live region: it is
 * there from the first paint, nothing to announce.
 */
export function AvisoNuevoFranja({ visible }: { readonly visible: boolean }) {
  const path = usePathname();
  if (!visible || path.startsWith('/privacidad')) return null;
  return (
    <aside className={s.franja} aria-label="Aviso de privacidad" data-testid="aviso-nuevo-franja">
      <span className={s.texto}>
        Actualizamos el aviso de privacidad. Revísalo y acéptalo cuando puedas.
      </span>
      <Link href="/privacidad" className={s.boton}>
        Revisar
      </Link>
    </aside>
  );
}

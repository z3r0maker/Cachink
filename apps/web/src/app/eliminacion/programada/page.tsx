import { CalendarClock } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { leerProgramada } from '@/server/cuenta/flash';

import { pila } from '../../_publico/publico.css';
import { IrA, TarjetaAviso } from '../../_publico/tarjeta-aviso';
import * as s from '../../_publico/tarjeta-aviso.css';
import { fechaLarga } from '../../(portal)/suscripcion/fecha';
import { tituloAcceso } from '../../login/auth-card.css';
import { MarcoEliminacion } from '../marco';

/**
 * Right after «Eliminar mi cuenta» (ElProgramada · Programada, ADR-136): the
 * session is gone, so the folio, the day and the businesses come from the
 * action's short-lived cookie. Without it there is nothing to show.
 */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Eliminación programada · Xangarro',
  robots: { index: false, follow: false },
};

function nombres(negocios: readonly string[]): string {
  return negocios.length <= 1
    ? (negocios[0] ?? 'tu negocio')
    : `${negocios.slice(0, -1).join(', ')} ni a ${negocios.at(-1) ?? ''}`;
}

export default async function ProgramadaPage() {
  const p = await leerProgramada();
  if (p === null) redirect('/login');
  return (
    <MarcoEliminacion>
      <TarjetaAviso icono={<CalendarClock size={24} />}>
        <div className={pila} role="status" data-testid="eliminacion-programada">
          <h1 className={tituloAcceso}>Tu cuenta se eliminará el {fechaLarga(p.eraseAt)}</h1>
          <p className={s.texto}>
            Ya cerramos la sesión de todos y desconectamos tus cajas. Nadie puede entrar a{' '}
            {nombres(p.negocios)}.
          </p>
          <p className={s.texto}>
            Te mandamos un correo con el folio{' '}
            <strong data-testid="eliminacion-folio">{p.folio}</strong> y un enlace para cancelar la
            eliminación. Te volvemos a escribir 3 días antes de borrar.
          </p>
          <IrA href="https://xangarro.mx" label="Ir a xangarro.mx" />
        </div>
      </TarjetaAviso>
    </MarcoEliminacion>
  );
}

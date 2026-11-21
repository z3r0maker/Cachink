import Link from 'next/link';

import { Don } from '@/components';
import { button } from '@/components/button.css';

import * as s from './escribir.css';

/**
 * «Enviado» (P-48, board `RpAyuda`): the message or the report reached the
 * team. It says where the answer goes, and that the cajas were never part of
 * the problem of writing in.
 */
export function Enviado(p: { readonly nombre: string | null; readonly correo: string }) {
  const gracias = p.nombre === null || p.nombre === '' ? 'Gracias.' : `Gracias, ${p.nombre}.`;
  return (
    <section className={s.enviado} role="status">
      <Don pose="celebrando" size={150} />
      <h2 className={s.enviadoTitulo}>{gracias} Ya nos llegó.</h2>
      <p className={s.enviadoTexto}>
        Te contestamos por correo a {p.correo}. Mientras, tus cajas siguen cobrando como siempre.
      </p>
      <Link href="/ayuda" className={button({ variant: 'primary', size: 'lg' })}>
        Volver a Ayuda
      </Link>
    </section>
  );
}

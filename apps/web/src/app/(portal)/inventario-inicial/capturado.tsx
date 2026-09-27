import Link from 'next/link';

import { Aviso } from '../_primeros/aviso';
import { Encabezado } from '../_primeros/encabezado';
import * as p from '../_primeros/primeros.css';
import * as s from './resumen.css';

export const SUBTITULO = 'Cuánto había de cada producto el día uno. Se captura una sola vez.';

/**
 * The done state: the inventory was captured, here or on an earlier visit.
 * The capture's own confirmation rides along when it just happened.
 */
export function Capturado({ confirmacion }: { readonly confirmacion: string | null }) {
  return (
    <>
      <Encabezado aqui="Inventario inicial" titulo="Inventario inicial" subtitulo={SUBTITULO} />
      {confirmacion !== null ? <Aviso tono="success">{confirmacion}</Aviso> : null}
      <section className={`${p.hero} ${s.listoCard}`} aria-labelledby="listo-t">
        <span className={s.listo} aria-hidden="true">
          <svg viewBox="0 0 24 24" width={32} height={32} fill="none">
            <path
              d="M20 6 9 17l-5-5"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h2 id="listo-t" className={s.listoTitulo}>
          Ya está capturado
        </h2>
        <p className={p.texto}>
          Tu inventario inicial se captura una sola vez y no cuenta para tu límite de movimientos.
          Para ajustar existencias, registra una entrada o una merma desde Productos.
        </p>
        <Link href="/productos" className={s.enlaceBoton}>
          Ir a Productos
        </Link>
      </section>
    </>
  );
}

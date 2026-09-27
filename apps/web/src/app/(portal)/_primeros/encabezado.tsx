import Link from 'next/link';
import type { ReactNode } from 'react';

import * as s from './primeros.css';

/**
 * «Primeros pasos › {aquí}» and the page heading of the first-day screens. The
 * trail goes back to «¿Cómo empiezo?», where these screens are linked from.
 */
export function Encabezado({
  aqui,
  titulo,
  subtitulo,
  extra,
}: {
  readonly aqui: string;
  readonly titulo: string;
  readonly subtitulo: string;
  readonly extra?: ReactNode;
}) {
  return (
    <>
      <nav aria-label="Ruta" className={s.ruta}>
        <Link href="/como-empiezo" className={s.rutaLink}>
          Primeros pasos
        </Link>
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" aria-hidden="true">
          <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth={2.4} strokeLinejoin="round" />
        </svg>
        <span className={s.rutaAqui} aria-current="page">
          {aqui}
        </span>
      </nav>
      <div className={s.cabeza}>
        <div className={s.cabezaTexto}>
          <h1 className={s.titulo}>{titulo}</h1>
          <p className={s.subtitulo}>{subtitulo}</p>
        </div>
        {extra}
      </div>
    </>
  );
}

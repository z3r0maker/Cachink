'use client';

import type { ReactNode } from 'react';

import { Icon } from '../../shell/icon';
import {
  DESCARGA_ARIA,
  DESCARGA_INTERRUMPIDA,
  DESCARGANDO,
  fraccionDescarga,
  textoPaginas,
  type ProgresoDescarga,
} from '@xangarro/caja';
import * as d from './descarga.css';

const AVISO = 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 8v4M12 16h.01';

/** Linking's download, page by page (DS-10): where it stands, or where it stopped. */
export interface Descarga {
  readonly fase: 'descargando' | 'interrumpida';
  readonly progreso: ProgresoDescarga | null;
}

/** «Descargando los datos de tu negocio… 3 de 7» and its bar; the interruption in amber. */
export function DescargaProgreso({ descarga }: { readonly descarga: Descarga }): ReactNode {
  const interrumpida = descarga.fase === 'interrumpida';
  const cuenta = textoPaginas(descarga.progreso);
  const f = fraccionDescarga(descarga.progreso);
  const p = descarga.progreso;
  return (
    <div
      className={d.caja}
      aria-live="polite"
      data-testid="vincular-descarga"
      data-interrumpida={interrumpida ? '' : undefined}
    >
      <div className={d.fila}>
        {interrumpida ? (
          <span className={d.icono} aria-hidden="true">
            <Icon path={AVISO} size={18} strokeWidth={2.2} />
          </span>
        ) : null}
        <span id="dl-l" className={d.texto}>
          {interrumpida ? DESCARGA_INTERRUMPIDA : DESCARGANDO}
        </span>
        <span className={d.cuenta}>{cuenta}</span>
      </div>
      <div
        className={d.barra}
        role="progressbar"
        aria-label={DESCARGA_ARIA}
        aria-valuemin={0}
        aria-valuemax={p?.paginas ?? undefined}
        aria-valuenow={p !== null && p.paginas !== null ? p.pagina : undefined}
        aria-valuetext={cuenta || undefined}
      >
        <span className={d.relleno} style={{ width: `${Math.round((f ?? 0) * 100)}%` }} />
      </div>
    </div>
  );
}

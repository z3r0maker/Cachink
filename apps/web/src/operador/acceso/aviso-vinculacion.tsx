import { AVISO_PUBLICO_URL, AVISO_VINCULACION, AVISO_VINCULACION_ENLACE } from '@xangarro/domain';
import type { ReactNode } from 'react';

import { button } from '../../components/button.css';
import * as v from './vincular.css';

/**
 * The aviso de privacidad at linking (N-34, variante B): shown as the third
 * step, no checkbox (it asks for nothing). Its version goes with the request
 * (`vincular.tsx`). The full aviso opens from a button, never a bare address.
 */
export function AvisoVinculacion(): ReactNode {
  return (
    <div className={v.aviso}>
      <span className={v.etiqueta}>Aviso de privacidad de la caja</span>
      <p className={v.avisoTexto} data-testid="vincular-aviso">
        {AVISO_VINCULACION.join(' ')}
      </p>
      <a
        href={AVISO_PUBLICO_URL}
        target="_blank"
        rel="noreferrer"
        className={`${button({ variant: 'secondary', size: 'sm' })} ${v.avisoEnlace}`}
        data-testid="vincular-aviso-enlace"
      >
        {AVISO_VINCULACION_ENLACE}
      </a>
    </div>
  );
}

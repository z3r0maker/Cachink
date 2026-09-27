import { AVISO_PUBLICO_URL, AVISO_VINCULACION } from '@xangarro/domain';
import type { ReactNode } from 'react';

import * as v from './vincular.css';

/**
 * The aviso de privacidad at linking (N-34, variante B): shown as the third
 * step, no checkbox (it asks for nothing). Its version goes with the request
 * (`vincular.tsx`).
 */
export function AvisoVinculacion(): ReactNode {
  const [primero, segundo] = AVISO_VINCULACION;
  return (
    <div className={v.aviso}>
      <span className={v.etiqueta}>Aviso de privacidad de la caja</span>
      <p className={v.avisoTexto} data-testid="vincular-aviso">
        {primero} {segundo} Aviso completo y derechos ARCO:{' '}
        <a href={AVISO_PUBLICO_URL} target="_blank" rel="noreferrer" className={v.fuerte}>
          xangarro.mx/privacidad
        </a>
      </p>
    </div>
  );
}

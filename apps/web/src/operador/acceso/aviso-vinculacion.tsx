import { AVISO_PUBLICO_URL, AVISO_VINCULACION } from '@xangarro/domain';
import type { ReactNode } from 'react';

import * as a from './acceso.css';

/**
 * The aviso de privacidad at linking (N-34, variante B): shown under the
 * button, no checkbox. Its version goes with the request (`vincular.tsx`).
 */
export function AvisoVinculacion(): ReactNode {
  const [primero, segundo] = AVISO_VINCULACION;
  return (
    <p className={a.hint} data-testid="vincular-aviso">
      {primero} {segundo} Aviso completo y derechos ARCO:{' '}
      <a href={AVISO_PUBLICO_URL} target="_blank" rel="noreferrer">
        xangarro.mx/privacidad
      </a>
    </p>
  );
}

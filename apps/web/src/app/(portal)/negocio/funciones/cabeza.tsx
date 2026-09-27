'use client';

import { Don } from '@/components';
import { eyebrow as eyebrowCls } from '@/styles/text.css';

import * as f from './funciones.css';

/** The panel's title, the count and Don's one line (CfgFunciones). */
export function FuncionesCabeza({
  prendidas,
  total,
}: {
  readonly prendidas: number;
  readonly total: number;
}) {
  return (
    <>
      <div className={f.cabeza}>
        <div className={f.cabezaTexto}>
          <h2 id="funciones-titulo" className={f.titulo}>
            Funciones de tu negocio
          </h2>
          <p className={f.sub}>
            Prende lo que usas.{' '}
            <span className={f.cuenta}>
              {prendidas} de {total}
            </span>{' '}
            prendidas.
          </p>
        </div>
        <div className={f.don} role="note" aria-label="Nota de Don Cuentas">
          <span className={f.donCaja}>
            <Don pose="senalando" size={44} />
          </span>
          Prende solo lo que usas: la caja se ve más sencilla para tu equipo.
        </div>
      </div>
      <div className={f.encabezado} aria-hidden="true">
        <span className={eyebrowCls}>Función</span>
        <span className={eyebrowCls}>Plan</span>
        <span className={eyebrowCls}>Estado</span>
        <span className={eyebrowCls} style={{ textAlign: 'center' }}>
          Prender
        </span>
      </div>
    </>
  );
}

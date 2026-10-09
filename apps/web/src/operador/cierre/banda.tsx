'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Icon } from '../../shell/icon';
import { OPERADOR_BASE } from '@xangarro/caja';
import * as b from './banda.css';
import { BANDA_CUERPO, BANDA_NO_SE_PUDO, bandaTitulo } from '@xangarro/caja/cierre';
import type { Cierre } from './use-cierre';

const GIRO =
  'M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M16 16h5v5';
const DERECHA = 'm9 18 6-6-6-6';

/** «Enviando…» while it sends; after a retry that left records, that it keeps trying. */
function estadoTxt(x: Cierre, intentado: boolean): string {
  if (x.enviando) return 'Enviando…';
  return intentado && x.pendientes > 0 ? BANDA_NO_SE_PUDO : '';
}

/**
 * «Tienes 3 registros por enviar (1 se reintentará solo).» — a warning, not a
 * block (DS-06 (a), ADR-123, EsCajaCierre): the close stays enabled; a retry
 * and the way to see which stay at hand.
 */
export function Banda({ x }: { readonly x: Cierre }) {
  const [intentado, setIntentado] = useState(false);
  return (
    <section aria-labelledby="blq-t" className={b.banda} data-testid="cierre-por-enviar">
      <span className={b.tile} aria-hidden="true">
        <span className={x.enviando ? b.gira : undefined} style={{ display: 'inline-flex' }}>
          <Icon path={GIRO} size={22} strokeWidth={2.2} />
        </span>
      </span>
      <div className={b.cuerpo}>
        <h2 id="blq-t" className={b.titulo}>
          {bandaTitulo(x.pendientes, x.reintentando)}
        </h2>
        <p className={b.texto}>{BANDA_CUERPO}</p>
        <span role="status" className={b.estado}>
          {estadoTxt(x, intentado)}
        </span>
      </div>
      <Acciones x={x} onIntento={() => setIntentado(true)} />
    </section>
  );
}

/** «Reintentar envío» (skips the wait) and «Ver cuáles» (Registros por enviar). */
function Acciones({ x, onIntento }: { readonly x: Cierre; readonly onIntento: () => void }) {
  return (
    <div className={b.acciones}>
      <button
        type="button"
        className={b.reintentar}
        aria-busy={x.enviando}
        onClick={() => {
          onIntento();
          x.enviar();
        }}
      >
        {x.enviando ? 'Enviando…' : 'Reintentar envío'}
      </button>
      <Link href={`${OPERADOR_BASE}/pendientes`} className={b.verCuales}>
        Ver cuáles
        <Icon path={DERECHA} size={16} strokeWidth={2.4} />
      </Link>
    </div>
  );
}

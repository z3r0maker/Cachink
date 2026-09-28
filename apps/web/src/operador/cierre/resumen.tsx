import { Fragment, type ReactNode } from 'react';
import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as r from './resumen.css';
import type { ResumenTurno } from '@xangarro/caja/cierre';
import type { Cierre } from './use-cierre';

const CHECK = 'M20 6 9 17l-5-5';
const RELOJ = 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3 2';

function partes(t: ResumenTurno): readonly (readonly [string, ReactNode])[] {
  const canceladas = t.canceladas === 1 ? 'cancelada' : 'canceladas';
  return [
    [
      'ventas',
      <>
        <b className={r.cifra}>{t.ventas}</b> ventas
      </>,
    ],
    [
      'canceladas',
      <>
        <b className={r.cifra}>{t.canceladas}</b> {canceladas}
        {t.canceladaHora ? <span className={r.hora}>{` (${t.canceladaHora})`}</span> : null}
      </>,
    ],
    [
      'fiado',
      <>
        Fiado{' '}
        <b className={r.cifra} style={{ color: colors.warningText }}>
          {formatMoney(t.fiado)}
        </b>
      </>,
    ],
    [
      'inventario',
      <>
        <b className={r.cifra}>{t.entradas}</b> entradas · <b className={r.cifra}>{t.mermas}</b>{' '}
        mermas
      </>,
    ],
  ];
}

/** «Resumen del turno» in one line: what happened, and whether everything was sent. */
export function Resumen({ x, t }: { readonly x: Cierre; readonly t: ResumenTurno }) {
  return (
    <section aria-label="Resumen del turno" className={r.strip}>
      <span className={r.eyebrow}>Resumen del turno</span>
      {partes(t).map(([k, v]) => (
        <Fragment key={k}>
          <span className={r.sep} aria-hidden="true" />
          <span className={r.item}>{v}</span>
        </Fragment>
      ))}
      {x.pendientes > 0 ? (
        <span className={r.sync} data-pendiente="">
          <Icon path={RELOJ} size={16} strokeWidth={2.4} />
          {`${x.pendientes} por enviar`}
        </span>
      ) : (
        <span className={r.sync}>
          <Icon path={CHECK} size={16} strokeWidth={2.6} />
          Todo enviado
        </span>
      )}
    </section>
  );
}

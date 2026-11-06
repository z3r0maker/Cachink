import { formatMonth } from '@xangarro/domain';
import Link from 'next/link';

import { mesesVecinos } from '@/server/empresa/movimiento-view';
import type { EmpresaHref } from '@/shell/empresa-nav';
import * as m from '@/styles/mostrador.css';

import { EncabezadoSeccion } from './encabezado-seccion';

/**
 * The header of Dinero's month screens (board «Dinero · Movimientos» of
 * canvas «Ronda 7»): Dinero's title and tabs, the month on screen, and the
 * month links. `children` are the screen's own actions after them.
 */
export function EncabezadoDinero(props: {
  readonly actual: EmpresaHref;
  readonly mes: string;
  readonly children?: React.ReactNode;
}) {
  const { anterior, siguiente } = mesesVecinos(props.mes);
  const nombre = formatMonth(props.mes);
  return (
    <EncabezadoSeccion actual={props.actual} sub={nombre.charAt(0).toUpperCase() + nombre.slice(1)}>
      <div className={m.row}>
        <Link className={m.boton.quieto} href={`?mes=${anterior}`}>
          Mes anterior
        </Link>
        <Link className={m.boton.quieto} href={`?mes=${siguiente}`}>
          Mes siguiente
        </Link>
        {props.children}
      </div>
    </EncabezadoSeccion>
  );
}

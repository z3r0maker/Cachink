'use client';

import Link from 'next/link';

import { Icon } from '../../shell/icon';
import * as h from './header.css';
import { OPERADOR_BASE } from './nav';
import { HeaderAction } from './shell';

const PLUS = 'M12 5v14M5 12h14';

/** «Nueva venta»: the header's yellow action on Turno, Ventas, Inventario and Cobranza. */
export function NuevaVenta() {
  return (
    <HeaderAction>
      <Link href={`${OPERADOR_BASE}/caja`} className={h.action} data-onyellow="">
        <Icon path={PLUS} size={17} strokeWidth={2.4} />
        Nueva venta
      </Link>
    </HeaderAction>
  );
}

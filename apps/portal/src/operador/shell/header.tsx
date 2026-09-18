import Link from 'next/link';

import { Icon } from '../../shell/icon';
import * as h from './header.css';
import { ICONS, OPERADOR_BASE } from './nav';
import type { OperadorShellData } from './types';

/** Screens portal their yellow action («Nueva venta», …) into this node. */
export const HEADER_ACTION_ID = 'operador-header-action';

export function OperadorHeader({ data }: { readonly data: OperadorShellData }) {
  return (
    <header className={h.header}>
      <div className={h.inner}>
        <div className={h.bizPill}>
          <div className={h.bizTile}>{data.negocio.iniciales}</div>
          <div style={{ minWidth: 0 }}>
            <div className={h.bizName}>{data.negocio.nombre}</div>
            <div className={h.bizSub}>{data.caja} · Operativo</div>
          </div>
        </div>
        <div className={h.right}>
          <SyncPill data={data} />
          <Bell unread={data.avisosSinLeer} />
          <div id={HEADER_ACTION_ID} style={{ display: 'contents' }} />
        </div>
      </div>
    </header>
  );
}

/** Links to Registros por enviar; amber with the queue count when offline. */
function SyncPill({ data }: { readonly data: OperadorShellData }) {
  const offline = data.connection === 'sin-conexion';
  return (
    <Link
      href={`${OPERADOR_BASE}/pendientes`}
      className={h.syncPill}
      title="Ver registros pendientes"
      data-offline={offline ? '' : undefined}
    >
      <span className={h.syncDot} />
      <span className={h.syncLabel}>
        {offline ? `Sin conexión · ${data.pendientes} por enviar` : 'Todo enviado'}
      </span>
    </Link>
  );
}

function Bell({ unread }: { readonly unread: number }) {
  return (
    <Link
      href={`${OPERADOR_BASE}/avisos`}
      className={h.bell}
      title="Avisos"
      aria-label={`Avisos · ${unread} sin leer`}
    >
      <Icon path={ICONS.bell} size={21} strokeWidth={2.3} />
      {unread > 0 ? <span className={h.bellCount}>{unread}</span> : null}
    </Link>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icon } from '../../shell/icon';
import { back } from './back.css';
import * as h from './header.css';
import { headerFor, ICONS, OPERADOR_BASE, type HeaderMode } from './nav';
import type { OperadorShellData } from './types';

/** Screens portal their header action («Nueva venta», …) into this node. */
export const HEADER_ACTION_ID = 'operador-header-action';

const CHEVRON_LEFT = 'M15 6l-6 6 6 6';

export function OperadorHeader({ data }: { readonly data: OperadorShellData }) {
  const mode: HeaderMode = headerFor(usePathname());
  return (
    <header className={h.header}>
      <div className={h.inner}>
        {mode.back ? (
          <Link href={mode.back.href} className={back} title={mode.back.title}>
            <Icon path={CHEVRON_LEFT} size={17} strokeWidth={2.5} />
            {mode.back.label}
          </Link>
        ) : (
          <BizPill data={data} />
        )}
        <div className={h.right}>
          {mode.status === 'none' ? null : <SyncPill data={data} asLink={mode.status === 'full'} />}
          {mode.status === 'full' && mode.bell !== false ? (
            <Bell unread={data.avisosSinLeer} />
          ) : null}
          <div id={HEADER_ACTION_ID} style={{ display: 'contents' }} />
        </div>
      </div>
    </header>
  );
}

function BizPill({ data }: { readonly data: OperadorShellData }) {
  return (
    <div className={h.bizPill}>
      <div className={h.bizTile}>{data.negocio.iniciales}</div>
      <div style={{ minWidth: 0 }}>
        <div className={h.bizName}>{data.negocio.nombre}</div>
        <div className={h.bizSub}>{data.caja} · Operativo</div>
      </div>
    </div>
  );
}

/** Amber with the queue count when offline; a link to Registros por enviar on main screens. */
function SyncPill({
  data,
  asLink,
}: {
  readonly data: OperadorShellData;
  readonly asLink: boolean;
}) {
  const offline = data.connection === 'sin-conexion';
  const body = (
    <>
      <span className={h.syncDot} />
      <span className={h.syncLabel}>
        {offline ? `Sin conexión · ${data.pendientes} por enviar` : 'Todo enviado'}
      </span>
    </>
  );
  const flag = offline ? '' : undefined;
  if (!asLink) {
    return (
      <div className={h.syncStatic} data-offline={flag}>
        {body}
      </div>
    );
  }
  return (
    <Link
      href={`${OPERADOR_BASE}/pendientes`}
      className={h.syncPill}
      title="Ver registros pendientes"
      data-offline={flag}
    >
      {body}
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

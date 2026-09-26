'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { brand } from '@xangarro/tokens';

import { Coin, Icon } from '../../shell/icon';
import { ICONS, OPERADOR_BASE, SIDEBAR_GROUPS, isActive, type OperadorNavGroup } from './nav';
import * as s from './shell.css';
import * as b from './sidebar.css';
import type { OperadorShellData } from './types';

/** The coin is 38 px inside a 2.5 px border in the design (content-box). */
const COIN_OUTER = brand.coinSidebar + 5;

export interface SidebarProps {
  readonly data: OperadorShellData;
  /** Absent until the lock screen exists (O-13): no button that does nothing. */
  readonly onLock?: () => void;
}

export function OperadorSidebar({ data, onLock }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className={s.aside}>
      <div className={s.brandBlock}>
        <Coin size={COIN_OUTER} />
        <span className={s.wordmark}>XANGARRO!</span>
      </div>
      <CajaPill data={data} />
      <nav className={s.nav} aria-label="Navegación de la caja">
        {SIDEBAR_GROUPS.map((group) => (
          <Grupo key={group.label ?? 'top'} group={group} pathname={pathname} />
        ))}
      </nav>
      <TurnoCard data={data} onLock={onLock} />
    </aside>
  );
}

function Grupo(p: { readonly group: OperadorNavGroup; readonly pathname: string }) {
  return (
    <div role="group" aria-label={p.group.label ?? undefined}>
      {p.group.label === null ? null : <div className={b.groupLabel}>{p.group.label}</div>}
      {p.group.items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          title={item.label}
          className={s.navItem}
          aria-current={isActive(item.href, p.pathname) ? 'page' : undefined}
        >
          <Icon path={item.icon} />
          <span className={s.navLabel}>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}

/** Which register this is, and whether a turno is open on it. */
function CajaPill({ data }: { readonly data: OperadorShellData }) {
  const abierto = data.turno !== null;
  return (
    <div className={b.cajaPill}>
      <span className={b.cajaTile}>
        <Icon path={ICONS.caja} size={18} />
      </span>
      <span className={b.cajaText}>
        <span className={b.cajaName}>{data.caja}</span>
        <span className={b.cajaSub}>{data.negocio.nombre}</span>
      </span>
      <span
        className={b.cajaDot}
        data-abierto={abierto ? '' : undefined}
        title={abierto ? 'Turno abierto' : 'Sin turno abierto'}
      />
    </div>
  );
}

function TurnoCard({ data, onLock }: SidebarProps) {
  const { turno, operador } = data;
  return (
    <div className={turno ? b.card : `${b.card} ${b.cardSinTurno}`}>
      <div className={s.who}>
        <span className={s.avatar}>{operador.iniciales}</span>
        <div style={{ minWidth: 0 }}>
          <div className={s.whoName}>{operador.nombre}</div>
          <div className={s.whoSub}>
            {turno ? `Cobrando desde las ${turno.desde}` : 'Sin turno abierto'}
          </div>
        </div>
      </div>
      {turno ? (
        <div className={b.cardActions}>
          {onLock ? (
            <button type="button" className={b.lock} title="Bloquear caja" onClick={onLock}>
              <Icon path={ICONS.lock} size={18} strokeWidth={2.4} title="Bloquear caja" />
            </button>
          ) : null}
          <Link href={`${OPERADOR_BASE}/cierre`} className={b.close}>
            Cerrar mi turno
          </Link>
        </div>
      ) : null}
    </div>
  );
}

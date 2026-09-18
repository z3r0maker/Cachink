'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { brand } from '@xangarro/tokens';

import { Coin, Icon } from '../../shell/icon';
import { ICONS, OPERADOR_BASE, SIDEBAR_ITEMS, isActive } from './nav';
import * as s from './shell.css';
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
      <nav className={s.nav} aria-label="Navegación de la caja">
        {SIDEBAR_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={s.navItem}
            aria-current={isActive(item.href, pathname) ? 'page' : undefined}
          >
            <Icon path={item.icon} />
            <span className={s.navLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
      <TurnoBlock data={data} onLock={onLock} />
    </aside>
  );
}

function TurnoBlock({ data, onLock }: SidebarProps) {
  const { turno, operador, caja } = data;
  return (
    <div className={s.foot}>
      <div className={s.eyebrow}>{turno ? 'Turno abierto' : 'Sin turno abierto'}</div>
      <div className={s.who}>
        <span className={s.avatar}>{operador.iniciales}</span>
        <div style={{ minWidth: 0 }}>
          <div className={s.whoName}>{operador.nombre}</div>
          <div className={s.whoSub}>{turno ? `Desde ${turno.desde} · ${caja}` : caja}</div>
        </div>
      </div>
      {turno ? (
        <div className={s.footActions}>
          {onLock ? (
            <button type="button" className={s.lockButton} title="Bloquear caja" onClick={onLock}>
              <Icon path={ICONS.lock} size={18} strokeWidth={2.4} title="Bloquear caja" />
            </button>
          ) : null}
          <Link href={`${OPERADOR_BASE}/cierre`} className={s.closeLink}>
            Cerrar turno
          </Link>
        </div>
      ) : null}
    </div>
  );
}

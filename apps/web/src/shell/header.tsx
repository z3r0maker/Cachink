'use client';

import Link from 'next/link';

import { Bell } from './bell';
import { Icon } from './icon';
import { AYUDA_ICON } from './nav-items';
import { Palette } from './palette';
import { SyncPill } from './sync-pill';
import { UserMenu, type UserMenuProps } from './user-menu';
import { srOnly } from '../styles/global.css';
import { bell, header, inner, right } from './header.css';

export interface HeaderProps {
  readonly account: UserMenuProps;
  readonly pendingRows: number;
  /** Unread avisos, **excluding** Asesor rows (ADR-060). */
  readonly unreadNotices: number;
}

/**
 * The top bar (ADR-107): find anything on the left; on the right, sync
 * status, help, avisos and the account menu. The business switcher lives in
 * the sidebar and the plan in the account menu.
 */
export function Header(props: HeaderProps) {
  return (
    <header className={header}>
      <div className={inner}>
        <Palette />
        <div className={right}>
          {/* Named by the pill's own words, then where it goes (WCAG 2.5.3). */}
          <Link href="/sincronizacion" style={{ textDecoration: 'none' }}>
            <SyncPill pending={props.pendingRows} />
            <span className={srOnly}>, ver sincronización</span>
          </Link>
          <Link href="/ayuda" className={bell} aria-label="Ayuda">
            <Icon path={AYUDA_ICON} size={21} />
          </Link>
          <Bell unread={props.unreadNotices} />
          <UserMenu {...props.account} />
        </div>
      </div>
    </header>
  );
}

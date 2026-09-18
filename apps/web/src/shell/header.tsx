'use client';

import { Tag } from '@/components';

import { Bell } from './bell';
import { SyncPill } from './sync-pill';
import { UserMenu } from './user-menu';
import { BusinessSwitcher, type NegocioOption } from './business-switcher';
import { header, inner, right } from './header.css';

export interface HeaderProps {
  /** The business this session is on, and every one the account can switch to. */
  readonly current: NegocioOption;
  readonly negocios: readonly NegocioOption[];
  readonly planLabel: string;
  readonly pendingRows: number;
  /** Unread avisos, **excluding** Asesor rows (ADR-060). */
  readonly unreadNotices: number;
  readonly userInitials: string;
}

export function Header(props: HeaderProps) {
  return (
    <header className={header}>
      <div className={inner}>
        <BusinessSwitcher current={props.current} negocios={props.negocios} />
        <div className={right}>
          <Bell unread={props.unreadNotices} />
          <Tag tone="brand">Plan {props.planLabel}</Tag>
          <SyncPill pending={props.pendingRows} />
          <UserMenu initials={props.userInitials} />
        </div>
      </div>
    </header>
  );
}

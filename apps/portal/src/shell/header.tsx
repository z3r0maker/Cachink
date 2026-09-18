'use client';

import Link from 'next/link';

import { Tag } from '@/components';

import { Icon } from './icon';
import { SyncPill } from './sync-pill';
import { UserMenu } from './user-menu';
import { BusinessSwitcher, type NegocioOption } from './business-switcher';
import { badge, bell, header, inner, right } from './header.css';

const BELL_PATH = 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9';

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
          <Link
            href="/avisos"
            className={bell}
            aria-label={`Avisos · ${props.unreadNotices} sin leer`}
          >
            <Icon path={BELL_PATH} size={21} strokeWidth={2.3} />
            {props.unreadNotices > 0 ? <span className={badge}>{props.unreadNotices}</span> : null}
          </Link>
          <Tag tone="brand">Plan {props.planLabel}</Tag>
          <SyncPill pending={props.pendingRows} />
          <UserMenu initials={props.userInitials} />
        </div>
      </div>
    </header>
  );
}

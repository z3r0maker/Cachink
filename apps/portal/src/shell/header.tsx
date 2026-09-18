'use client';

import Link from 'next/link';

import { Tag } from '@/components';

import { Icon } from './icon';
import { SyncPill } from './sync-pill';
import { UserMenu } from './user-menu';
import {
  badge,
  bell,
  bizName,
  header,
  initialsTile,
  inner,
  right,
  roleLabel,
  switcher,
} from './header.css';

const BELL_PATH = 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9';

export interface HeaderProps {
  readonly businessName: string;
  readonly businessInitials: string;
  readonly role: 'owner' | 'admin' | 'viewer';
  readonly planLabel: string;
  readonly pendingRows: number;
  /** Unread avisos, **excluding** Asesor rows (ADR-060). */
  readonly unreadNotices: number;
  readonly userInitials: string;
}

const ROLE_LABEL = {
  owner: 'Dueño',
  admin: 'Administrador',
  viewer: 'Solo lectura',
} as const;

export function Header(props: HeaderProps) {
  return (
    <header className={header}>
      <div className={inner}>
        <button type="button" className={switcher} aria-label="Cambiar de negocio">
          <span className={initialsTile}>{props.businessInitials}</span>
          <span style={{ minWidth: 0 }}>
            <span className={bizName}>{props.businessName}</span>
            <span className={roleLabel}>{ROLE_LABEL[props.role]}</span>
          </span>
        </button>
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

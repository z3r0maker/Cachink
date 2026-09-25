'use client';

import * as Menu from '@radix-ui/react-dropdown-menu';
import Link from 'next/link';

import { AVISO_INTEGRAL_URL } from '@/legal/aviso-simplificado';
import { logout } from '@/server/actions/auth';

import { Icon } from './icon';
import { avatar, avatarHit } from './header.css';
import { ACCOUNT_ITEMS, PRIVACY_ICON, type NavItem } from './nav-items';
import * as s from './user-menu.css';

export interface UserMenuProps {
  readonly initials: string;
  readonly businessName: string;
  readonly roleLabel: string;
  readonly planLabel: string;
  /** Rows a device could not send; shown beside Sincronización. */
  readonly pendingRows: number;
}

function Extra({ href, p }: { readonly href: string; readonly p: UserMenuProps }) {
  if (href === '/suscripcion') {
    return <span className={`${s.pill} ${s.pillTone.plan}`}>{p.planLabel}</span>;
  }
  if (href === '/sincronizacion' && p.pendingRows > 0) {
    return <span className={`${s.pill} ${s.pillTone.warn}`}>{p.pendingRows} sin enviar</span>;
  }
  return null;
}

function Row({ item, p }: { readonly item: NavItem; readonly p: UserMenuProps }) {
  return (
    <Menu.Item asChild>
      <Link href={item.href} className={s.itemLink}>
        <Icon path={item.icon} size={19} />
        {item.label}
        <Extra href={item.href} p={p} />
      </Link>
    </Menu.Item>
  );
}

/**
 * The account menu (ADR-107): the business's settings, help and privacy,
 * then «Cerrar sesión». Signing out ends the session **on the server** (audit
 * SEC-AUTH-01): a copy of the cookie stops working too. It is a form, so it
 * works before the page has hydrated.
 */
export function UserMenu(p: UserMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger className={avatarHit} aria-label="Menú de usuario">
        <span className={avatar}>{p.initials}</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content className={s.menu} style={{ width: 300 }} align="end" sideOffset={8}>
          <div className={s.menuHead}>
            <span className={avatar}>{p.initials}</span>
            <span>
              <span className={s.menuName}>{p.businessName}</span>
              <span className={s.menuRole}>{p.roleLabel}</span>
            </span>
          </div>
          {ACCOUNT_ITEMS.map((item) => (
            <Row key={item.href} item={item} p={p} />
          ))}
          <Menu.Item asChild>
            <a href={AVISO_INTEGRAL_URL} className={s.itemLink}>
              <Icon path={PRIVACY_ICON} size={19} />
              Aviso de privacidad
            </a>
          </Menu.Item>
          <div className={s.separator} role="separator" />
          <form action={logout}>
            <Menu.Item asChild onSelect={(e) => e.preventDefault()}>
              <button type="submit" className={s.logoutItem}>
                Cerrar sesión
              </button>
            </Menu.Item>
          </form>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

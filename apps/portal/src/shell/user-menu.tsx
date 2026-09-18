'use client';

import * as Menu from '@radix-ui/react-dropdown-menu';

import { logout } from '@/server/actions/auth';

import { avatar, avatarHit } from './header.css';
import { item, menu } from './user-menu.css';

/**
 * The avatar opens the user menu. «Cerrar sesión» ends the session **on the
 * server** (audit SEC-AUTH-01): a copy of the cookie stops working too. It is a
 * form, so signing out works before the page has hydrated.
 */
export function UserMenu({ initials }: { readonly initials: string }) {
  return (
    <Menu.Root>
      <Menu.Trigger className={avatarHit} aria-label="Menú de usuario">
        <span className={avatar}>{initials}</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content className={menu} align="end" sideOffset={8}>
          <form action={logout}>
            <Menu.Item asChild onSelect={(e) => e.preventDefault()}>
              <button type="submit" className={item}>
                Cerrar sesión
              </button>
            </Menu.Item>
          </form>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

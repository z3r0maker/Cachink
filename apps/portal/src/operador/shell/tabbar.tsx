'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icon } from '../../shell/icon';
import { TABBAR_ITEMS, isActive } from './nav';
import * as t from './tabbar.css';

/** Below 760 px the sidebar gives way to this fixed four-tab bar. */
export function OperadorTabbar() {
  const pathname = usePathname();
  return (
    <nav className={t.tabbar} aria-label="Navegación de la caja">
      {TABBAR_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={t.tab}
          aria-current={isActive(item.href, pathname) ? 'page' : undefined}
        >
          <Icon path={item.icon} size={22} strokeWidth={2.3} />
          <span className={t.tabLabel}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

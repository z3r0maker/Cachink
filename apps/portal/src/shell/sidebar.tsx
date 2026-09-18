'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Coin, Icon } from './icon';
import { NAV_ITEMS, type NavItem } from './nav-items';
import {
  aside,
  brandBlock,
  divider,
  dividerLabel,
  dividerRule,
  nav,
  navItem,
  navLabel,
  wordmark,
} from './sidebar.css';

function isActive(item: NavItem, pathname: string): boolean {
  const path = item.href.split('?')[0] ?? '/';
  return path === '/' ? pathname === '/' : pathname.startsWith(path);
}

function NavLink({ item, active }: { readonly item: NavItem; readonly active: boolean }) {
  return (
    <Link
      href={item.href}
      title={item.label}
      className={navItem}
      aria-current={active ? 'page' : undefined}
    >
      <Icon path={item.icon} />
      <span className={navLabel}>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className={aside}>
      <div className={brandBlock}>
        <Coin />
        <span className={wordmark}>XANGARRO!</span>
      </div>
      <nav className={nav} aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => (
          <div key={item.href} style={{ display: 'contents' }}>
            <NavLink item={item} active={isActive(item, pathname)} />
            {item.dividerAfter ? (
              <div className={divider}>
                <span className={dividerLabel}>Configuración</span>
                <span className={dividerRule} />
              </div>
            ) : null}
          </div>
        ))}
      </nav>
    </aside>
  );
}

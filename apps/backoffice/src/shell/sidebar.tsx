'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icon, NAV_ICONS } from './icons';
import { NAV_ITEMS, type NavHref, type NavItem } from './nav-items';
import {
  aside,
  badge,
  brand,
  nav,
  navCount,
  navCountHot,
  navItem,
  navLabel,
  wordmark,
} from './shell.css';

/** A count beside a destination; `hot` paints it as needing someone. */
export interface NavCount {
  readonly label: string;
  readonly hot: boolean;
}

function isActive(item: NavItem, pathname: string): boolean {
  return item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
}

export function Sidebar({
  counts,
  children,
}: {
  readonly counts: Partial<Record<NavHref, NavCount>>;
  readonly children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <aside className={aside}>
      <div className={brand}>
        <span className={wordmark}>XANGARRO!</span>
        <span className={badge}>TORRE DE CONTROL</span>
      </div>
      <nav className={nav} aria-label="Navegación de la consola">
        {NAV_ITEMS.map((item) => {
          const count = counts[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={navItem}
              aria-current={isActive(item, pathname) ? 'page' : undefined}
            >
              <Icon d={NAV_ICONS[item.href]} />
              <span className={navLabel}>{item.label}</span>
              {count === undefined ? null : (
                <span className={count.hot ? `${navCount} ${navCountHot}` : navCount}>
                  {count.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      {children}
    </aside>
  );
}

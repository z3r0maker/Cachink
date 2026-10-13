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
  navGroup,
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

function NavLink({
  item,
  pathname,
  count,
}: {
  readonly item: NavItem;
  readonly pathname: string;
  readonly count: NavCount | undefined;
}) {
  return (
    <Link
      href={item.href}
      className={navItem}
      aria-current={isActive(item, pathname) ? 'page' : undefined}
    >
      <Icon d={NAV_ICONS[item.href]} />
      <span className={navLabel}>{item.label}</span>
      {count === undefined ? null : (
        <span className={count.hot ? `${navCount} ${navCountHot}` : navCount}>{count.label}</span>
      )}
    </Link>
  );
}

/**
 * The console rail. `empresa` is the founders' group (ADR-124 §1): empty for
 * everyone else, and then not even its heading is drawn.
 */
export function Sidebar({
  counts,
  empresa,
  children,
}: {
  readonly counts: Partial<Record<NavHref, NavCount>>;
  readonly empresa: readonly NavItem[];
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
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} count={counts[item.href]} />
        ))}
        {empresa.length === 0 ? null : (
          <>
            <span className={navGroup}>Empresa</span>
            {empresa.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} count={counts[item.href]} />
            ))}
          </>
        )}
      </nav>
      {children}
    </aside>
  );
}

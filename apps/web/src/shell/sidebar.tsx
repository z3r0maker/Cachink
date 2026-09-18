'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Coin, Icon } from './icon';
import { NAV_ITEMS, type NavItem } from './nav-items';
import {
  aside,
  badge,
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
  if (item.activeOn?.some((p) => pathname.startsWith(p))) return true;
  return path === '/' ? pathname === '/' : pathname.startsWith(path);
}

/** Pending counts by item href, e.g. `{ '/revision-caja': 6 }`; zero shows nothing. */
export type NavBadges = Readonly<Partial<Record<string, number>>>;

function NavLink(p: { readonly item: NavItem; readonly active: boolean; readonly badge?: number }) {
  const { item } = p;
  const n = p.badge ?? 0;
  return (
    <Link
      href={item.href}
      title={item.label}
      aria-label={n > 0 ? `${item.label}, ${n} pendientes` : undefined}
      className={navItem}
      aria-current={p.active ? 'page' : undefined}
    >
      <Icon path={item.icon} />
      <span className={navLabel}>{item.label}</span>
      {n > 0 ? (
        <span className={badge} aria-hidden="true">
          {n}
        </span>
      ) : null}
    </Link>
  );
}

export function Sidebar({ badges = {} }: { readonly badges?: NavBadges }) {
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
            <NavLink item={item} active={isActive(item, pathname)} badge={badges[item.href]} />
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

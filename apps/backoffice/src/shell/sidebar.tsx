'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { type EmpresaEntry, isEntryActive } from './empresa-nav';
import { EMPRESA_ICONS, Icon, NAV_ICONS } from './icons';
import { MobileNav } from './mobile-nav';
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

function NavLink(props: {
  readonly href: string;
  readonly label: string;
  readonly icon: string;
  readonly active: boolean;
  readonly count?: NavCount | undefined;
}) {
  const { count } = props;
  return (
    <Link href={props.href} className={navItem} aria-current={props.active ? 'page' : undefined}>
      <Icon d={props.icon} />
      <span className={navLabel}>{props.label}</span>
      {count === undefined ? null : (
        <span className={count.hot ? `${navCount} ${navCountHot}` : navCount}>{count.label}</span>
      )}
    </Link>
  );
}

/** The founders' group: empty for everyone else, and then not even its heading. */
function EmpresaGroup(props: {
  readonly entries: readonly EmpresaEntry[];
  readonly pathname: string;
}) {
  if (props.entries.length === 0) return null;
  return (
    <>
      <span className={navGroup}>Empresa</span>
      {props.entries.map((entry) => (
        <NavLink
          key={entry.id}
          href={entry.tabs[0].href}
          label={entry.label}
          icon={EMPRESA_ICONS[entry.id]}
          active={isEntryActive(entry, props.pathname)}
        />
      ))}
    </>
  );
}

function Brand() {
  return (
    <div className={brand}>
      <span className={wordmark}>XANGARRO!</span>
      <span className={badge}>TORRE DE CONTROL</span>
    </div>
  );
}

/**
 * The console rail. `empresa` is the founders' group (ADR-125 §1): empty for
 * everyone else, and then not even its heading is drawn. Each of its entries
 * stays lit on any of its tabs' routes. On a phone the same rail opens from
 * the top bar's «Menú» (`MobileNav`, canvas CD-19).
 */
export function Sidebar({
  counts,
  empresa,
  children,
}: {
  readonly counts: Partial<Record<NavHref, NavCount>>;
  readonly empresa: readonly EmpresaEntry[];
  readonly children: React.ReactNode;
}) {
  const pathname = usePathname();
  const links = (
    <nav className={nav} aria-label="Navegación de la consola">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={NAV_ICONS[item.href]}
          active={isActive(item, pathname)}
          count={counts[item.href]}
        />
      ))}
      <EmpresaGroup entries={empresa} pathname={pathname} />
    </nav>
  );
  return (
    <>
      <aside className={aside}>
        <Brand />
        {links}
        {children}
      </aside>
      <MobileNav brand={<Brand />}>
        {links}
        {children}
      </MobileNav>
    </>
  );
}

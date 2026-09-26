'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BusinessSwitcher, type NegocioOption } from './business-switcher';
import { Coin } from './icon';
import { NAV_GROUPS, type NavItem } from './nav-items';
import { AyudaFooter, NavLink, PasosCard, type Pasos } from './sidebar-parts';
import {
  aside,
  brandBlock,
  groupLabel,
  nav,
  railToggle,
  switcherSlot,
  wordmark,
} from './sidebar.css';

export type { Pasos };

function isActive(item: NavItem, pathname: string): boolean {
  const path = item.href.split('?')[0] ?? '/';
  if (item.activeOn?.some((p) => pathname.startsWith(p))) return true;
  return path === '/' ? pathname === '/' : pathname.startsWith(path);
}

/** Pending counts by item href, e.g. `{ '/revision-caja': 6 }`; zero shows nothing. */
export type NavBadges = Readonly<Partial<Record<string, number>>>;

/**
 * The owner's rail choice (P-24), remembered in this browser only. Storage can
 * be missing or throw (private windows); the sidebar then just starts expanded.
 */
const RAIL_KEY = 'xg-sidebar-rail';

function useRail() {
  const [rail, setRail] = useState(false);
  useEffect(() => {
    try {
      setRail(window.localStorage.getItem(RAIL_KEY) === '1');
    } catch {
      // No storage: keep the default.
    }
  }, []);
  const toggle = () => {
    setRail(!rail);
    try {
      window.localStorage.setItem(RAIL_KEY, rail ? '0' : '1');
    } catch {
      // No storage: the choice lasts this visit.
    }
  };
  return { rail, toggle };
}

/** The owner's logo when there is one (N-19), the wordmark otherwise. */
function BrandBlock({ logoUrl }: { readonly logoUrl: string | null }) {
  if (logoUrl !== null) {
    return (
      <div className={brandBlock}>
        {/* Alt empty on purpose: decorative navigation branding. */}
        <img src={logoUrl} alt="" style={{ maxHeight: 44, maxWidth: 148, objectFit: 'contain' }} />
      </div>
    );
  }
  return (
    <div className={brandBlock}>
      <Coin />
      <span className={wordmark}>XANGARRO!</span>
    </div>
  );
}

export interface SidebarProps {
  readonly badges?: NavBadges;
  /** The owner's logo (N-19); null renders the XANGARRO! wordmark. */
  readonly logoUrl?: string | null;
  readonly current: NegocioOption;
  readonly negocios: readonly NegocioOption[];
  /** Setup progress; null hides the card (setup complete, or not the owner). */
  readonly pasos: Pasos | null;
}

function Groups({ badges, pathname }: { readonly badges: NavBadges; readonly pathname: string }) {
  return (
    <nav className={nav} aria-label="Navegación principal">
      {NAV_GROUPS.map((group) => (
        <div
          key={group.label ?? 'top'}
          role="group"
          aria-label={group.label ?? undefined}
          style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          {group.label === null ? null : <div className={groupLabel}>{group.label}</div>}
          {group.items.map((item: NavItem) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item, pathname)}
              badge={badges[item.href]}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ badges = {}, logoUrl = null, current, negocios, pasos }: SidebarProps) {
  const pathname = usePathname();
  const { rail, toggle } = useRail();
  return (
    <aside className={aside} data-rail={rail}>
      <BrandBlock logoUrl={logoUrl} />
      <div className={switcherSlot}>
        <BusinessSwitcher current={current} negocios={negocios} />
      </div>
      {pasos === null ? null : <PasosCard pasos={pasos} />}
      <Groups badges={badges} pathname={pathname} />
      <AyudaFooter />
      <button
        type="button"
        className={railToggle}
        aria-pressed={rail}
        aria-label={rail ? 'Expandir menú' : 'Contraer menú'}
        onClick={toggle}
      >
        {rail ? '»' : '« Contraer menú'}
      </button>
    </aside>
  );
}

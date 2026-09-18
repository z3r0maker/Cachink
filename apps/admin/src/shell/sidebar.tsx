'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV_ITEMS, type NavItem } from './nav-items';
import { aside, badge, brand, nav, navItem, wordmark } from './shell.css';

function isActive(item: NavItem, pathname: string): boolean {
  return item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
}

export function Sidebar({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <aside className={aside}>
      <div className={brand}>
        <span className={wordmark}>XANGARRO!</span>
        <span className={badge}>Consola interna</span>
      </div>
      <nav className={nav} aria-label="Navegación de la consola">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={navItem}
            aria-current={isActive(item, pathname) ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </aside>
  );
}

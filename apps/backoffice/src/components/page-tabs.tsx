import Link from 'next/link';

import { pageTab, pageTabs } from '@/styles/mostrador-tabs.css';

export interface PageTab {
  readonly label: string;
  readonly href: string;
}

/**
 * The tabs under a page's title (plan §2): each one is a link to its screen's
 * own URL, the current one marked with `aria-current`. One tab is no choice,
 * so a single tab draws no bar at all.
 */
export function PageTabs(props: {
  readonly label: string;
  readonly tabs: readonly PageTab[];
  readonly actual: string;
}) {
  if (props.tabs.length < 2) return null;
  return (
    <nav className={pageTabs} aria-label={props.label}>
      {props.tabs.map((t) => (
        <Link
          key={t.href}
          className={pageTab}
          href={t.href}
          aria-current={t.href === props.actual ? 'page' : undefined}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

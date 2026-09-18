import { NAV_ITEMS, type NavItem } from '@/shell/nav-items';
import { body, card, heading, muted } from '@/styles/ui.css';

/** A placeholder module page: what it will hold, and which task fills it. */
export function Stub({ href }: { readonly href: NavItem['href'] }) {
  const item = NAV_ITEMS.find((i) => i.href === href);
  if (!item) return null;
  return (
    <section className={card} aria-labelledby="stub-title">
      <h1 id="stub-title" className={heading}>
        {item.label}
      </h1>
      <p className={body}>{item.summary}</p>
      <p className={muted}>Pendiente: lo construye la tarea {item.task}.</p>
    </section>
  );
}

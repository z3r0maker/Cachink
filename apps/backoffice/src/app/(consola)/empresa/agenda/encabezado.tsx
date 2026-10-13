import Link from 'next/link';

import * as a from '@/styles/mostrador-agenda.css';
import * as m from '@/styles/mostrador.css';

/** The Agenda's header and its two tabs (E-04, boards CD-05 and CD-05b). */
const TABS = [
  { id: 'proximos', label: 'Próximos', href: '/empresa/agenda' },
  { id: 'evidencias', label: 'Evidencias', href: '/empresa/agenda/evidencias' },
] as const;

export function EncabezadoAgenda({ activo }: { readonly activo: 'proximos' | 'evidencias' }) {
  return (
    <header className={m.head}>
      <div className={m.headText}>
        <span className={m.eyebrow}>MEXIA · Empresa</span>
        <h1 className={m.title}>Agenda</h1>
      </div>
      <nav className={a.tabs} aria-label="Vistas de la agenda">
        {TABS.map((t) => (
          <Link
            key={t.id}
            className={a.tab}
            href={t.href}
            aria-current={t.id === activo ? 'page' : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

import Link from 'next/link';

import * as a from '@/styles/mostrador-agenda.css';

import { EncabezadoSeccion } from '../encabezado-seccion';

/**
 * The Agenda's header: Cumplimiento's title and tabs (plan §2), then the
 * Agenda's own two views (E-04, boards CD-05 and CD-05b) inside the content.
 */
const VISTAS = [
  { id: 'proximos', label: 'Próximos', href: '/empresa/agenda' },
  { id: 'evidencias', label: 'Evidencias', href: '/empresa/agenda/evidencias' },
] as const;

export function EncabezadoAgenda({ activo }: { readonly activo: 'proximos' | 'evidencias' }) {
  return (
    <>
      <EncabezadoSeccion actual="/empresa/agenda" />
      <nav className={a.tabs} aria-label="Vistas de la agenda">
        {VISTAS.map((t) => (
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
    </>
  );
}

import Link from 'next/link';
import type { Route } from 'next';
import { SUPPORT_KINDS, SUPPORT_STATUSES } from '@xangarro/domain';

import { KIND_LABELS, STATUS_LABELS } from '@/server/inbox/labels';
import { SAVED_FILTERS, type SavedFilter } from '@/server/inbox/list';
import { label } from '@/styles/ui.css';

import { chip, chipGroup, chipRow } from './inbox.css';
import { inboxHref, type InboxView } from './params';

function Chip(props: { readonly href: string; readonly on: boolean; readonly children: string }) {
  return (
    <Link href={props.href as Route} className={chip} aria-current={props.on ? 'true' : undefined}>
      {props.children}
    </Link>
  );
}

function SavedChips({ view }: { readonly view: InboxView }) {
  const names = Object.keys(SAVED_FILTERS) as SavedFilter[];
  return (
    <div className={chipRow}>
      <Chip
        href={inboxHref(view, { filtro: null, urgente: false, mias: false })}
        on={!view.filtro && !view.urgente && !view.mias}
      >
        Todo
      </Chip>
      {names.map((f) => (
        <Chip
          key={f}
          href={inboxHref(view, { filtro: view.filtro === f ? null : f })}
          on={view.filtro === f}
        >
          {SAVED_FILTERS[f].label}
        </Chip>
      ))}
      <Chip href={inboxHref(view, { urgente: !view.urgente })} on={view.urgente}>
        Urgentes
      </Chip>
      <Chip href={inboxHref(view, { mias: !view.mias })} on={view.mias}>
        Asignados a mí
      </Chip>
    </div>
  );
}

/** The inbox's filters as links: the URL is the state, so every view is shareable. */
export function FilterChips({ view }: { readonly view: InboxView }) {
  return (
    <nav aria-label="Filtros del inbox" className={chipGroup}>
      <SavedChips view={view} />
      {view.filtro ? null : (
        <>
          <span className={label}>Tipo</span>
          <div className={chipRow}>
            {SUPPORT_KINDS.map((k) => (
              <Chip
                key={k}
                href={inboxHref(view, { tipo: view.tipo === k ? null : k })}
                on={view.tipo === k}
              >
                {KIND_LABELS[k]}
              </Chip>
            ))}
          </div>
          <span className={label}>Estado</span>
          <div className={chipRow}>
            {SUPPORT_STATUSES.map((s) => (
              <Chip
                key={s}
                href={inboxHref(view, { estado: view.estado === s ? null : s })}
                on={view.estado === s}
              >
                {STATUS_LABELS[s]}
              </Chip>
            ))}
          </div>
        </>
      )}
    </nav>
  );
}

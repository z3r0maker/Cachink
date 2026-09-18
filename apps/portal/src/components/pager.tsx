'use client';

import { useEffect, useState } from 'react';

import { Button } from './button';

/**
 * Pagination for a table's rows (P-09: 10 per page). The counter says what is
 * on screen and what exists — «Mostrando 11–20 de 23» — and the page resets
 * whenever the rows change, so a filter never leaves you on an empty page.
 */
export function usePagina<T>(rows: readonly T[], size = 10) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [rows]);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pages - 1);
  return {
    visible: rows.slice(current * size, current * size + size),
    page: current,
    pages,
    from: rows.length === 0 ? 0 : current * size + 1,
    to: Math.min(rows.length, current * size + size),
    total: rows.length,
    prev: () => setPage(Math.max(0, current - 1)),
    next: () => setPage(Math.min(pages - 1, current + 1)),
  };
}

export type Pagina<T> = ReturnType<typeof usePagina<T>>;

export function Pager<T>({ p, noun }: { readonly p: Pagina<T>; readonly noun: string }) {
  return (
    <>
      <span role="status">
        Mostrando {p.from}–{p.to} de {p.total} {noun}
      </span>
      {p.pages > 1 ? (
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button size="sm" variant="secondary" onClick={p.prev} disabled={p.page === 0}>
            Anterior
          </Button>
          <span>
            Página {p.page + 1} de {p.pages}
          </span>
          <Button size="sm" variant="secondary" onClick={p.next} disabled={p.page === p.pages - 1}>
            Siguiente
          </Button>
        </span>
      ) : null}
    </>
  );
}

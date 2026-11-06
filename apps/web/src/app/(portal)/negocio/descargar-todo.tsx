'use client';

import { useState } from 'react';

import { Button } from '@/components/button';
import { MonedaGirando } from '@/components/don/cargando';
import { guardar, LIMITE } from '@/components/export-button';

import * as s from './descargar-todo.css';

/**
 * «Descargar todo» (ElNegocio, ElEliminar): the whole business as one .zip,
 * the five workbooks plus `datos.json`, from `GET /api/export/todo`. Owner
 * only; the route says so too.
 *
 * Fetched rather than linked, as `ExportButton` does (DS-02): a whole history
 * takes a while, and a plain link showed nothing until the download bar, so
 * people clicked again, each click another export against the five every ten
 * minutes. Busy and disabled until the file is in hand; a failure is a line
 * under the button, never a saved error page.
 */
const FALLO = 'No pudimos preparar tu archivo. Intenta otra vez en un momento.';

const nombreDe = (disposition: string | null) =>
  /filename="([^"]+)"/.exec(disposition ?? '')?.[1] ?? 'xangarro-todo.zip';

/** `null` when saved (or on the way to sign in), the line to show otherwise. */
async function descargarTodo(negocio?: string): Promise<string | null> {
  try {
    const url =
      negocio === undefined
        ? '/api/export/todo'
        : `/api/export/todo?negocio=${encodeURIComponent(negocio)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.status === 401) {
      // The session died: reloading lets the page's own gate send them to sign in.
      window.location.reload();
      return null;
    }
    if (res.status === 429) return LIMITE;
    if (!res.ok) return FALLO;
    // A stream that breaks halfway rejects here: no half file is saved.
    guardar(await res.blob(), nombreDe(res.headers.get('Content-Disposition')));
    return null;
  } catch {
    return FALLO;
  }
}

export interface DescargarTodoProps {
  /** Fills its container's width: the deletion page's step. */
  readonly full?: boolean;
  /** Another business the account owns; the session's own when absent. */
  readonly negocio?: string;
}

export function DescargarTodo({ full = false, negocio }: DescargarTodoProps) {
  const [preparando, setPreparando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const descargar = async () => {
    if (preparando) return;
    setError(null);
    setPreparando(true);
    setError(await descargarTodo(negocio));
    setPreparando(false);
  };
  return (
    <div className={full ? s.pilaCompleta : s.pila}>
      <Button
        variant="secondary"
        full={full}
        onClick={() => void descargar()}
        disabled={preparando}
        aria-busy={preparando}
        icon={preparando ? <MonedaGirando /> : undefined}
        data-testid="descargar-todo"
      >
        {preparando ? 'Preparando…' : 'Descargar todo'}
      </Button>
      {error === null ? null : (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
    </div>
  );
}

'use client';

import { Button } from '@/components';

import { saveBar } from '../negocio.css';
import type { Edicion } from './use-edicion';

/** The sticky yellow bar edit mode shows: one save for every card. */
export function SaveBar({ e }: { readonly e: Edicion }) {
  if (e.draft === null) return null;
  return (
    <div className={saveBar} role="region" aria-label="Guardar cambios del negocio">
      <span style={{ fontWeight: 800 }}>{e.note ?? 'Estás editando tu negocio.'}</span>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
        <Button variant="secondary" onClick={e.cancel} disabled={e.pending}>
          Cancelar
        </Button>
        {/* Dark, not yellow: the bar itself is yellow, and a yellow button on
            it reads as a panel rather than as the action (D-2). */}
        <Button variant="dark" onClick={e.save} disabled={e.pending}>
          {e.pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </span>
    </div>
  );
}

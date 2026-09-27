'use client';

import { colors } from '@xangarro/tokens';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components';
import { marcarAvisosLeidos } from '@/server/actions/avisos';
import { Icon } from '@/shell/icon';

import { hecho } from './avisos.css';

const DOBLE_PALOMITA = 'M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16';

/**
 * «Marcar todo como leído».
 *
 * Reports what it did («3 avisos marcados») rather than going quiet: the badge
 * it clears lives in the header, so silence reads as nothing having happened.
 * With nothing unread it rests disabled.
 */
export function MarcarLeidosButton({ sinPendientes }: { readonly sinPendientes: boolean }) {
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(): void {
    startTransition(async () => {
      const r = await marcarAvisosLeidos();
      setNote(
        r.ok
          ? {
              ok: true,
              text: `${r.marked} ${r.marked === 1 ? 'aviso marcado' : 'avisos marcados'}`,
            }
          : { ok: false, text: r.message },
      );
      if (r.ok) router.refresh();
    });
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {note === null ? null : (
        <span
          role="status"
          data-testid="avisos-note"
          className={hecho}
          style={note.ok ? undefined : { color: colors.redText }}
        >
          {note.ok ? <Icon path="M20 6 9 17l-5-5" size={16} strokeWidth={2.6} /> : null}
          {note.text}
        </span>
      )}
      <Button variant="secondary" onClick={run} disabled={pending || sinPendientes}>
        <Icon path={DOBLE_PALOMITA} size={18} strokeWidth={2.2} />
        {pending ? 'Marcando…' : 'Marcar todo como leído'}
      </Button>
    </div>
  );
}

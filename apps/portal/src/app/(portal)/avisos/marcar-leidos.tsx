'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components';
import { marcarAvisosLeidos } from '@/server/actions/avisos';

/**
 * "Marcar todo como leído".
 *
 * Reports what it did — "3 avisos marcados" — rather than going quiet. The
 * button's effect is otherwise invisible from this screen: the badge it clears
 * lives in the header, so silence reads as nothing having happened.
 */
export function MarcarLeidosButton() {
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(): void {
    startTransition(async () => {
      const result = await marcarAvisosLeidos();
      setNote(
        result.ok
          ? `${result.marked} ${result.marked === 1 ? 'aviso marcado' : 'avisos marcados'}`
          : result.message,
      );
      if (result.ok) router.refresh();
    });
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {note === null ? null : <span data-testid="avisos-note">{note}</span>}
      <Button variant="secondary" onClick={run} disabled={pending}>
        {pending ? 'Marcando…' : 'Marcar todo como leído'}
      </Button>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { AvisoLinea, type Aviso } from '@/avisos/linea';
import { Drawer } from '@/components';
import { avisosDelBell } from '@/server/actions/avisos';
import { canWrite } from '@/session/gating';
import { useSession } from '@/session/provider';

import { Icon } from './icon';
import { badge, bell } from './header.css';

/**
 * The bell (P-31): the unread count on the button, and a 400 px side panel
 * with the newest open avisos — never the Asesor's (ADR-060). The list is
 * fetched when the panel opens, so no page pays for it up front. «Ver todos»
 * goes to the full page.
 */
const BELL_PATH = 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9';

function usePanel() {
  const [open, setOpen] = useState(false);
  const [avisos, setAvisos] = useState<readonly Aviso[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const load = () =>
    startTransition(async () => {
      const r = await avisosDelBell();
      if (!r.ok) return setError(r.message);
      setError(null);
      setAvisos(r.avisos);
    });
  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) load();
  };
  return { open, onOpenChange, avisos, error, load };
}

function Lista({
  p,
  mayWrite,
}: {
  readonly p: ReturnType<typeof usePanel>;
  readonly mayWrite: boolean;
}) {
  if (p.error !== null) return <p role="alert">{p.error}</p>;
  if (p.avisos === null) return <p>Cargando…</p>;
  if (p.avisos.length === 0) return <p>No tienes avisos pendientes.</p>;
  return (
    <>
      {p.avisos.map((n) => (
        <AvisoLinea key={n.id} n={n} mayWrite={mayWrite} onChanged={p.load} />
      ))}
    </>
  );
}

export function Bell({ unread }: { readonly unread: number }) {
  const p = usePanel();
  const mayWrite = canWrite(useSession().role);
  return (
    <>
      <button
        type="button"
        className={bell}
        aria-label={`Avisos · ${unread} sin leer`}
        onClick={() => p.onOpenChange(true)}
      >
        <Icon path={BELL_PATH} size={21} strokeWidth={2.3} />
        {unread > 0 ? <span className={badge}>{unread}</span> : null}
      </button>
      <Drawer
        open={p.open}
        onOpenChange={p.onOpenChange}
        heading="Avisos"
        description="Lo más reciente que requiere tu atención."
        width={400}
        actions={
          <Link href="/avisos" onClick={() => p.onOpenChange(false)}>
            Ver todos los avisos
          </Link>
        }
      >
        <Lista p={p} mayWrite={mayWrite} />
      </Drawer>
    </>
  );
}

'use client';

import type { AccionAviso } from '@xangarro/domain';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { cambiarEstadoAviso } from '@/server/actions/avisos';
import type { AvisosData } from '@/server/screens';
import { Icon } from '@/shell/icon';

import { cuando } from './cuando';
import * as s from './tarjeta.css';
import { tipoDe } from './tipo';

export type Aviso = NonNullable<AvisosData>[number];

const FLECHA = 'M5 12h14M12 5l7 7-7 7';

function useEstado(id: string) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const run = (accion: AccionAviso) =>
    startTransition(async () => {
      const r = await cambiarEstadoAviso(id, accion);
      if (!r.ok) return setError(r.message);
      router.refresh();
    });
  return { error, pending, run };
}

function Acciones(p: {
  readonly n: Aviso;
  readonly mayWrite: boolean;
  readonly e: ReturnType<typeof useEstado>;
}) {
  const { n, mayWrite, e } = p;
  const leer = () => (mayWrite && n.state === 'nuevo' ? e.run('leer') : undefined);
  return (
    <div className={s.acciones}>
      {n.ctaHref ? (
        <Link href={n.ctaHref} className={s.ir} onClick={leer}>
          {n.ctaLabel ?? 'Ver'}
          <Icon path={FLECHA} size={16} strokeWidth={2.4} />
        </Link>
      ) : null}
      {mayWrite ? (
        <button
          type="button"
          className={s.listo}
          disabled={e.pending}
          aria-label={`Listo, quitar este aviso: ${n.title}`}
          onClick={() => e.run('resolver')}
        >
          Listo
        </button>
      ) : null}
    </div>
  );
}

/**
 * One aviso (P-31): its link goes where the aviso points and marks it read on
 * the way; «Listo» closes it. Solo lectura only reads (`mayWrite`), and the
 * server refuses regardless.
 */
export function AvisoTarjeta({ n, mayWrite }: { readonly n: Aviso; readonly mayWrite: boolean }) {
  const e = useEstado(n.id);
  const nuevo = n.state === 'nuevo';
  const t = tipoDe(n);
  return (
    <article className={s.tarjeta} data-nuevo={nuevo ? '' : undefined}>
      {nuevo ? (
        <span className={s.punto} role="img" aria-label="Sin leer" />
      ) : (
        <span className={s.hueco} />
      )}
      <span className={s.ficha} style={{ background: t.bg, color: t.fg }} aria-hidden="true">
        <Icon path={t.icono} size={24} strokeWidth={2} />
      </span>
      <div className={s.texto}>
        <span className={s.meta}>
          <span className={s.ceja}>{t.ceja}</span>
          <span aria-hidden="true">·</span>
          <span>{cuando(n.createdAt)}</span>
        </span>
        <h2 className={s.titulo}>{n.title}</h2>
        <p className={e.error ? s.error : s.cuerpo}>{e.error ?? n.body}</p>
      </div>
      <Acciones n={n} mayWrite={mayWrite} e={e} />
    </article>
  );
}

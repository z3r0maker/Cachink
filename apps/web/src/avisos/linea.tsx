'use client';

import type { AccionAviso } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components';
import type { NoticeSeverity } from '@/fixtures/notices';
import { cambiarEstadoAviso } from '@/server/actions/avisos';
import type { AvisosData } from '@/server/screens';

import { noticeBody, noticeRow, noticeTitle, noticeWhen, severityTile } from './linea.css';

/**
 * One aviso (P-31), on the Avisos page and in the bell panel. Severity always
 * pairs a tone with a glyph — never colour alone. Its CTA goes where the aviso
 * points and marks it read on the way; «Listo» closes it. Admins act; Solo
 * lectura only reads (`mayWrite`), and the server refuses regardless.
 */
const SEVERITY: Record<NoticeSeverity, { readonly bg: string; readonly glyph: string }> = {
  critical: { bg: colors.redSoft, glyph: '!' },
  warning: { bg: colors.warningSoft, glyph: '△' },
  info: { bg: colors.blueSoft, glyph: 'i' },
  success: { bg: colors.greenSoft, glyph: '✓' },
};

export type Aviso = NonNullable<AvisosData>[number];

function useEstado(id: string, onChanged?: () => void) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const run = (accion: AccionAviso) =>
    startTransition(async () => {
      const r = await cambiarEstadoAviso(id, accion);
      if (!r.ok) return setError(r.message);
      onChanged?.();
      router.refresh();
    });
  return { error, pending, run };
}

function Acciones(props: {
  readonly n: Aviso;
  readonly mayWrite: boolean;
  readonly e: ReturnType<typeof useEstado>;
}) {
  const { n, mayWrite, e } = props;
  const leer = () => (mayWrite && n.state === 'nuevo' ? e.run('leer') : undefined);
  return (
    <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
      {n.ctaHref ? (
        <Link href={n.ctaHref} onClick={leer}>
          {n.ctaLabel ?? 'Ver'} →
        </Link>
      ) : null}
      {mayWrite ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => e.run('resolver')}
          disabled={e.pending}
        >
          Listo
        </Button>
      ) : null}
    </span>
  );
}

export function AvisoLinea(props: {
  readonly n: Aviso;
  readonly mayWrite: boolean;
  readonly onChanged?: () => void;
}) {
  const { n, mayWrite } = props;
  const s = SEVERITY[n.severity as NoticeSeverity];
  const e = useEstado(n.id, props.onChanged);
  return (
    <div className={noticeRow}>
      <span className={severityTile} style={{ background: s.bg }} aria-hidden="true">
        {s.glyph}
      </span>
      <span style={{ minWidth: 0 }}>
        <span className={noticeTitle}>{n.title}</span>
        <span className={noticeBody}>{n.body}</span>
        <span className={noticeWhen}>
          {e.error ?? (n.state === 'nuevo' ? 'Sin leer' : 'Leído')}
        </span>
      </span>
      <Acciones n={n} mayWrite={mayWrite} e={e} />
    </div>
  );
}

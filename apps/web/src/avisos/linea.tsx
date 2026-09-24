'use client';

import { formatFechaHora, type AccionAviso } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components';
import type { NoticeSeverity } from '@/fixtures/notices';
import { cambiarEstadoAviso } from '@/server/actions/avisos';
import type { AvisosData } from '@/server/screens';

import {
  noticeBody,
  noticeMeta,
  noticeRow,
  noticeRowLeido,
  noticeTitle,
  noticeTitleLeido,
  severityTile,
  unreadDot,
  unreadDotOff,
} from './linea.css';

/**
 * One aviso (P-31), on the Avisos page and in the bell panel. Severity always
 * pairs a tone with a glyph — never colour alone. Its CTA goes where the aviso
 * points and marks it read on the way; «Listo» closes it. Admins act; Solo
 * lectura only reads (`mayWrite`), and the server refuses regardless.
 */
const SEVERITY: Record<
  NoticeSeverity,
  { readonly bg: string; readonly fg: string; readonly glyph: string }
> = {
  // The design pairs each tone with its own ink (D-3). Ours tinted the tile
  // and left the glyph at default, so colour alone carried the severity.
  critical: { bg: colors.redSoft, fg: colors.redText, glyph: '!' },
  warning: { bg: colors.warningSoft, fg: colors.warningText, glyph: '△' },
  info: { bg: colors.blueSoft, fg: colors.blueText, glyph: 'i' },
  success: { bg: colors.greenSoft, fg: colors.greenText, glyph: '✓' },
};

/** Who the aviso came from — the design's «· Xangarro!» half of the meta. */
const FUENTE: Record<string, string> = {
  sistema: 'Xangarro!',
  operacion: 'Operación',
  asesor: 'Don Cuentas',
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

/**
 * «12 sep 2026, 18:40 · Xangarro!». The design writes the time relatively for
 * anything recent («Hace 40 min») and names the device and the operator on an
 * operación aviso — the first needs a clock this row cannot reach without a
 * hydration mismatch, the second needs columns `notices` does not have. Both
 * are recorded with W-4; the absolute time and the source are real today.
 */
function meta(n: Aviso): string {
  return `${formatFechaHora(n.createdAt)} · ${FUENTE[n.source] ?? 'Xangarro!'}`;
}

export function AvisoLinea(props: {
  readonly n: Aviso;
  readonly mayWrite: boolean;
  readonly onChanged?: () => void;
}) {
  const { n, mayWrite } = props;
  const s = SEVERITY[n.severity as NoticeSeverity];
  const e = useEstado(n.id, props.onChanged);
  const sinLeer = n.state === 'nuevo';
  return (
    <div className={sinLeer ? noticeRow : `${noticeRow} ${noticeRowLeido}`}>
      <span
        className={sinLeer ? unreadDot : unreadDotOff}
        role={sinLeer ? 'img' : undefined}
        aria-label={sinLeer ? 'Sin leer' : undefined}
        aria-hidden={sinLeer ? undefined : true}
      />
      <span className={severityTile} style={{ background: s.bg, color: s.fg }} aria-hidden="true">
        {s.glyph}
      </span>
      <span style={{ minWidth: 0 }}>
        <span className={sinLeer ? noticeTitle : `${noticeTitle} ${noticeTitleLeido}`}>
          {n.title}
        </span>
        <span className={noticeBody}>{n.body}</span>
        <span className={noticeMeta}>{e.error ?? meta(n)}</span>
      </span>
      <Acciones n={n} mayWrite={mayWrite} e={e} />
    </div>
  );
}

'use client';

import { colors } from '@xangarro/tokens';

import { Button } from '@/components';
import type { NoticeSeverity } from '@/fixtures/notices';
import type { AvisosData } from '@/server/screens';

import { noticeBody, noticeRow, noticeTitle, noticeWhen, severityTile } from './avisos.css';

/** Severity always pairs a tone with a glyph — never colour alone. */
const SEVERITY: Record<NoticeSeverity, { readonly bg: string; readonly glyph: string }> = {
  critical: { bg: colors.redSoft, glyph: '!' },
  warning: { bg: colors.warningSoft, glyph: '△' },
  info: { bg: colors.blueSoft, glyph: 'i' },
  success: { bg: colors.greenSoft, glyph: '✓' },
};

export function NoticeLine({ n }: { readonly n: AvisosData[number] }) {
  const s = SEVERITY[n.severity as NoticeSeverity];
  return (
    <div className={noticeRow}>
      <span className={severityTile} style={{ background: s.bg }} aria-hidden="true">
        {s.glyph}
      </span>
      <span style={{ minWidth: 0 }}>
        <span className={noticeTitle}>{n.title}</span>
        <span className={noticeBody}>{n.body}</span>
        <span className={noticeWhen}>{n.state === 'nuevo' ? 'Sin leer' : 'Leído'}</span>
      </span>
      <span style={{ marginLeft: 'auto' }}>
        <Button size="sm" variant="secondary">
          {n.ctaLabel ?? 'Ver'} →
        </Button>
      </span>
    </div>
  );
}

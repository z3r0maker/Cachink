'use client';

import { colors } from '@xangarro/tokens';

import { Button, Card, Tag } from '@/components';
import { CHANNELS, type NoticeSeverity } from '@/fixtures/notices';
import type { AvisosData } from '@/server/screens';
import { eyebrow } from '@/styles/text.css';

import {
  cell,
  channelHead,
  channelRow,
  colLabel,
  noticeBody,
  noticeRow,
  noticeTitle,
  noticeWhen,
  severityTile,
} from './avisos.css';

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

/**
 * «Configurar» — the delivery matrix.
 *
 * WhatsApp is designed but not delivered, so it sits in «Próximamente»
 * (design plan §7). **A critical aviso cannot be switched off**, which is why
 * those rows render a locked tag rather than a control.
 */
export function ConfigurarCard() {
  return (
    <Card>
      <div className={eyebrow} style={{ marginBottom: 14 }}>
        Cómo quieres enterarte
      </div>
      <div className={channelHead}>
        <span className={eyebrow}>Aviso</span>
        <span className={colLabel}>En el portal</span>
        <span className={colLabel}>Por correo</span>
        <span className={colLabel}>Por WhatsApp</span>
      </div>
      {CHANNELS.map((c) => (
        <div key={c.label} className={channelRow}>
          <span>
            <span style={{ fontWeight: 800, display: 'block' }}>{c.label}</span>
            {c.critical ? <span className={noticeWhen}>Siempre activo</span> : null}
          </span>
          <span className={cell}>
            {c.critical ? <Tag tone="danger">Obligatorio</Tag> : <Tag tone="success">Sí</Tag>}
          </span>
          <span className={cell}>
            {c.porCorreo ? <Tag tone="success">Sí</Tag> : <Tag tone="neutral">No</Tag>}
          </span>
          <span className={cell}>
            <Tag tone="soft">Próximamente</Tag>
          </span>
        </div>
      ))}
    </Card>
  );
}

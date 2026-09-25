import { style } from '@vanilla-extract/css';
import { fontSizes, radii, typography } from '@xangarro/tokens';

import { line, t } from '@/styles/theme.css';

/** Inicio · «Turno de hoy». */

export const top = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.7fr) repeat(3, minmax(0, 1fr))',
  gap: 14,
  '@media': {
    'screen and (max-width: 1199px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  },
});

export const brief = style({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '16px 18px',
  border: line.thin,
  borderRadius: radii[3],
  background: t.surface,
  '@media': { 'screen and (max-width: 1199px)': { gridColumn: '1 / -1' } },
});

export const briefTone = {
  guardia: style({ borderColor: t.warn }),
  tranquilo: style({ borderColor: t.ok }),
  alarma: style({ borderColor: t.bad }),
} as const;

export const moodLabel = {
  guardia: style({ color: t.warn }),
  tranquilo: style({ color: t.ok }),
  alarma: style({ color: t.bad }),
} as const;

export const briefBody = style({ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 });

export const briefLine = style({
  margin: 0,
  fontSize: fontSizes.lg,
  lineHeight: 1.45,
  fontWeight: typography.weights.bold,
  color: t.text,
});

export const actions = style({ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 });

export const split = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)',
  gap: 14,
  alignItems: 'start',
  '@media': { 'screen and (max-width: 1199px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const attentionRow = style({ gridTemplateColumns: '28px 86px minmax(0, 1fr) auto' });

export const feedRow = style({ gridTemplateColumns: '128px minmax(0, 1fr)', padding: '10px 18px' });

export const time = style({ color: t.accent });

export const empty = style({
  margin: 0,
  padding: '18px',
  fontSize: fontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: t.dim,
});

export const review = style({ padding: '4px 18px 18px' });

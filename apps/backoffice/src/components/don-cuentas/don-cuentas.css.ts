import { style } from '@vanilla-extract/css';
import { fontSizes, radii, typography } from '@xangarro/tokens';

import { line, t } from '@/styles/theme.css';

/** Don Cuentas in the console: a framed portrait and the note he signs. */

export const note = style({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '14px 16px',
  border: line.thin,
  borderRadius: radii[3],
  background: t.surface,
});

export const noteGuardia = style({ borderColor: t.warn });
export const noteTranquilo = style({ borderColor: t.ok });
export const noteAlarma = style({ borderColor: t.bad });

export const portrait = style({
  flex: 'none',
  position: 'relative',
  width: 76,
  height: 76,
  borderRadius: radii[3],
  background: t.accentSoft,
  border: `2px solid ${t.text}`,
  overflow: 'hidden',
});

export const portraitLg = style({ width: 128, height: 128, borderRadius: radii[5] });

export const image = style({
  position: 'absolute',
  inset: '4%',
  width: '92%',
  height: '92%',
  objectFit: 'contain',
});

export const text = style({
  margin: 0,
  fontSize: fontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.bold,
  color: t.body,
});

import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** DS-08's second tab (EsCajaPestana): the date, the two tabs, the rule, the wait. */

export const encabezado = style({ display: 'flex', flexDirection: 'column', gap: 12 });

/** Two browser tabs: the caja's, live; this one, dashed and waiting. */
export const pestanas = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 6,
  height: 56,
  boxSizing: 'border-box',
  padding: '0 12px',
  border: borders.quiet,
  borderBottom: borders.thin,
  borderRadius: `${radii[4]}px ${radii[4]}px 0 0`,
  background: colors.gray100,
});

const pestana = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 40,
  padding: '0 14px',
  borderBottom: 0,
  borderRadius: `${radii[2]}px ${radii[2]}px 0 0`,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
} as const;

export const pestanaCaja = style({
  ...pestana,
  border: borders.thin,
  background: colors.white,
  color: colors.black,
});

export const pestanaEsta = style({
  ...pestana,
  border: `2px dashed ${colors.gray400}`,
  background: colors.yellowSoft,
  color: colors.textMuted,
});

export const punto = style({
  width: 10,
  height: 10,
  boxSizing: 'border-box',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  background: colors.green,
});

export const regla = style({
  margin: 0,
  fontSize: portalFontSizes.xl,
  lineHeight: 1.35,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.01em',
  color: colors.black,
});

export const acciones = style({ display: 'flex', flexDirection: 'column', gap: 12 });

export const esperando = style({
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  textAlign: 'center',
});

export const sigue = style({
  margin: 0,
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '12px 14px',
  border: `2px solid ${colors.warningText}`,
  borderRadius: radii[3],
  background: colors.warningSoft,
  fontSize: portalFontSizes.body,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const sigueIcono = style({ display: 'inline-flex', color: colors.warningText });

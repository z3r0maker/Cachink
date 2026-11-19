import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/**
 * Impuestos (E-13, boards CD-09 and CD-09b): the month's total and its four
 * steps, the three tax cards with their estimate, contador and difference,
 * the papers, and the year's earlier months. A state is always a word on a
 * chip, never a colour alone.
 */
export const cabeza = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
});

export const total = style({
  margin: 0,
  fontSize: portalFontSizes.display,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '-0.03em',
});

export const muted = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const chipBase = style({
  display: 'inline-block',
  padding: '8px 14px',
  border: borders.thin,
  borderRadius: radii[2],
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

export const tono = styleVariants({
  ok: { background: colors.greenSoft, color: colors.greenText },
  info: { background: colors.blueSoft, color: colors.blueText },
  warn: { background: colors.warningSoft, color: colors.warningText },
  bad: { background: colors.redSoft, color: colors.redText },
  off: { background: colors.white, color: colors.ink },
});

export const pasos = style({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 10,
});

export const paso = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.offwhite,
});

export const circuloBase = style({
  flex: '0 0 auto',
  width: 26,
  height: 26,
  borderRadius: shapeRadii.pill,
  border: borders.thin,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
});

export const circulo = styleVariants({
  hecho: { background: colors.green },
  aviso: { background: colors.yellow },
  pendiente: { background: colors.white },
});

export const pasoTitulo = style({
  display: 'block',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
});

export const pasoSub = style({
  display: 'block',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const aviso = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '14px 16px',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.warningSoft,
});

export const papeles = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
  gap: 10,
});

export const papel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '12px 14px',
  borderRadius: radii[3],
  background: colors.offwhite,
});

export const papelCabeza = style({ display: 'flex', alignItems: 'center', gap: 12 });

export const archivo = style({ fontSize: portalFontSizes.sm, maxWidth: '100%' });

export const mesFila = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(120px, 1fr) minmax(0, 2fr) auto auto',
  gap: 16,
  alignItems: 'center',
  padding: '12px 4px',
  borderTop: borders.quiet,
  color: colors.ink,
  textDecoration: 'none',
  '@media': { 'screen and (max-width: 640px)': { gridTemplateColumns: '1fr auto' } },
});

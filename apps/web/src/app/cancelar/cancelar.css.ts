import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

export const marco = style({ width: '100%', maxWidth: 460, margin: '0 auto' });

export const texto = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const datos = style({
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  border: borders.quiet,
  borderRadius: radii[3],
});

export const dato = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 14px',
  selectors: { '& + &': { borderTop: borders.quiet } },
});

export const clave = style({ fontSize: portalFontSizes.md, color: colors.gray600 });

export const valor = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textAlign: 'right',
});

export const pie = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.5,
  color: colors.textMuted,
});

export const lleno = style({ width: '100%' });

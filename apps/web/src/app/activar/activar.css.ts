import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/** `/activar`: three steps in a hero card, the expiry note, two quiet panels (C-14). */

export const pasos = style({ listStyle: 'none', margin: '-12px 0', padding: 0 });

export const paso = style({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '14px 0',
  selectors: { '& + &': { borderTop: `2px solid ${colors.gray100}` } },
  '@media': { '(max-width: 599px)': { gap: 12 } },
});

export const numero = style({
  width: 32,
  height: 32,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: shapeRadii.pill,
  background: colors.black,
  color: colors.yellow,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
});

export const pasoTexto = style({ display: 'flex', flexDirection: 'column', gap: 3 });

export const pasoTitulo = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const pasoCuerpo = style({
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

/** «El enlace vence a los 15 minutos…»: amber, a fact about time. */
export const vence = style({
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  borderRadius: radii[3],
  background: colors.warningSoft,
  border: `2px solid ${colors.warningText}`,
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const venceIcono = style({ color: colors.warningText, flex: 'none' });

export const panales = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
  '@media': { '(max-width: 699px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const panel = style({ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' });

export const panelTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const panelTexto = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

/** The 8-letter code, drawn: four black boxes, a dash, four quiet ones. */
export const codigo = style({
  marginTop: 'auto',
  padding: 16,
  borderRadius: radii[3],
  background: colors.offwhite,
  border: borders.quiet,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
});

export const casillas = style({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
});

export const casilla = style({
  flex: '1 1 0',
  minWidth: 0,
  maxWidth: 30,
  height: 40,
  boxSizing: 'border-box',
  borderRadius: radii[0],
  background: colors.white,
  border: borders.thin,
});

export const casillaQuieta = style([casilla, { border: borders.quiet }]);

export const guion = style({ flex: 'none', width: 10, height: 2, background: colors.textMuted });

export const codigoPie = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.textMuted,
});

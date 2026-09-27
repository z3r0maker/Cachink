import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** Avisos (CfgAvisos): the head, the note «3 avisos marcados» and the empty inbox. */
export const cabeza = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 16,
  flexWrap: 'wrap',
});

export const titulos = style({
  flex: 1,
  minWidth: 240,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const pageTitle = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  '@media': { '(max-width: 720px)': { fontSize: portalFontSizes.xl5 } },
});

export const pageSubtitle = style({
  margin: 0,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const hecho = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.greenText,
});

export const vacio = style({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  padding: '22px 24px',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
});

export const vacioTexto = style({
  flex: 1,
  minWidth: 200,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const vacioTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const vacioCuerpo = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

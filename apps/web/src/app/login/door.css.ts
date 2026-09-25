import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '@/styles/press.css';

/** «¿Cómo vas a entrar?» — two big doors and the way to sign up. */

export const zona = style({
  width: '100%',
  maxWidth: 560,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
});

export const encabezado = style({ display: 'flex', flexDirection: 'column', gap: 6 });

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.1,
  letterSpacing: typography.letterSpacing.tighter,
});

export const bajada = style({
  margin: 0,
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const puertas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 18,
  '@media': { '(max-width: 559px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const puerta = style([
  pressable,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 250,
    padding: 22,
    textAlign: 'left',
    fontFamily: 'inherit',
    color: colors.black,
    background: colors.white,
    border: borders.thick,
    borderRadius: radii[4],
    boxShadow: shadows.card,
    selectors: { '&:hover': { background: colors.yellowSoft } },
    '@media': { '(max-width: 559px)': { minHeight: 0, padding: 18 } },
  },
]);

export const placa = style({
  width: 60,
  height: 60,
  display: 'grid',
  placeItems: 'center',
  borderRadius: radii[3],
  border: borders.thin,
  background: colors.yellow,
});

export const placaCaja = style([placa, { background: colors.greenSoft }]);

export const puertaTitulo = style({
  display: 'block',
  fontSize: portalFontSizes.cardTitle,
  lineHeight: 1.2,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
});

export const puertaCuerpo = style({
  display: 'block',
  fontSize: portalFontSizes.body,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const puertaPie = style({
  marginTop: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
});

export const registro = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  minHeight: 56,
  padding: '0 20px',
  background: colors.white,
  border: borders.thin,
  borderRadius: radii[3],
  textDecoration: 'none',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

import { style, styleVariants } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { pressable } from '@/styles/press.css';

/** «Pendientes de hoy» rows (ADR-107): icon, words, and the action to take. */
export const pendRow = style([
  pressable,
  {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '10px 12px',
    borderRadius: radii[3],
    border: 0,
    boxShadow: 'none',
    color: colors.black,
    textDecoration: 'none',
    selectors: { '&:hover': { background: colors.offwhite } },
    // On a phone the action drops under the text instead of squeezing it.
    '@media': { 'screen and (max-width: 599px)': { flexWrap: 'wrap' } },
  },
]);

/** The row's words: they take the room, and on a phone push the action below. */
export const pendTexto = style({ flex: '1 1 0', minWidth: 0 });

export const pendIcon = style({
  width: 40,
  height: 40,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: radii[2],
});

export const pendTone = styleVariants({
  alerta: { background: colors.redSoft, color: colors.redText },
  sync: { background: colors.warningSoft, color: colors.warningText },
  gente: { background: colors.blueSoft, color: colors.blueText },
  paso: { background: colors.purpleSoft, color: colors.black },
});

export const pendTitle = style({
  display: 'block',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
});

export const pendSub = style({
  display: 'block',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const pendCta = style({
  marginLeft: 'auto',
  '@media': { 'screen and (max-width: 599px)': { flexBasis: '100%', marginLeft: 54 } },
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
});

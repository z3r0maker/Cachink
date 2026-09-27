import { style, styleVariants } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/**
 * El Mostrador's words for the operator screens redesigned after the boards:
 * the eyebrow, the four buttons (primary yellow, secondary, quiet,
 * destructive) and the radio chip. Kept apart from `ui.css` so the older
 * screens keep their look until their turn.
 */
export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.textMuted,
});

const base = {
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  minHeight: 48,
  padding: '0 20px',
  borderRadius: radii[3],
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
} as const;

export const boton = styleVariants({
  primario: [
    pressable,
    {
      ...base,
      border: borders.thick,
      background: colors.yellow,
      boxShadow: shadows.small,
      selectors: {
        '&:hover:not(:disabled)': { background: colors.yellowDeep },
        '&:disabled': { background: colors.gray100, boxShadow: 'none', color: colors.textMuted },
      },
    },
  ],
  secundario: [pressable, { ...base, border: borders.thin, background: colors.white }],
  quieto: [
    pressable,
    { ...base, border: borders.quiet, background: colors.white, color: colors.gray600 },
  ],
  peligro: [
    pressable,
    {
      ...base,
      border: `2px solid ${colors.redText}`,
      background: colors.white,
      color: colors.redText,
    },
  ],
  peligroLleno: [
    pressable,
    {
      ...base,
      border: borders.thin,
      background: colors.redText,
      boxShadow: shadows.small,
      color: colors.white,
      selectors: {
        '&:disabled': {
          opacity: 1,
          background: colors.gray100,
          border: borders.quiet,
          boxShadow: 'none',
          color: colors.textMuted,
        },
      },
    },
  ],
});

/** A radio chip: white with a quiet edge, black with yellow text when chosen. */
export const chip = style([
  pressable,
  {
    boxSizing: 'border-box',
    minHeight: 44,
    padding: '0 16px',
    border: borders.quiet,
    borderRadius: shapeRadii.pill,
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    selectors: {
      '&[aria-checked="true"]': {
        border: borders.thin,
        background: colors.black,
        color: colors.yellow,
      },
    },
  },
]);

/** Same chip with a black edge while unchosen (the cancel dialog's motivos). */
export const chipMarcado = style([chip, { border: borders.thin }]);

/** A text field wrapper: 48 px, black 2 px edge, rounded 14. */
export const campo = style({
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 48,
  padding: '0 14px',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.white,
  selectors: { '&:focus-within': { outline: `3px solid ${colors.yellow}`, outlineOffset: 2 } },
});

export const campoInput = style({
  flex: 1,
  minWidth: 0,
  border: 0,
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.black,
  /* The wrapper draws the focus ring (`campo`'s :focus-within). */
  selectors: { '&:focus-visible': { outline: 'none', boxShadow: 'none' } },
});

export const etiqueta = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const opcional = style({ fontWeight: typography.weights.semibold, color: colors.textMuted });

import { style, styleVariants } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  pressTransform,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

/**
 * El Mostrador in the console (ADR-117, ADR-124): the «Empresa» area's
 * surfaces, after `docs/design/el-mostrador.md`. Light only; the area wraps
 * itself in `torreLight`, so these never meet the dark roles.
 */

/** Covers the work area edge to edge: `main`'s padding is undone and redone. */
export const sheet = style({
  margin: '-22px -24px -32px',
  padding: '22px 24px 40px',
  minHeight: 'calc(100vh - 48px)',
  background: colors.gray200,
  color: colors.ink,
});

export const page = style({ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1240 });

export const head = style({ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' });

export const headText = style({ flex: 1, minWidth: 0 });

export const eyebrow = style({
  display: 'block',
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const title = style({
  margin: '4px 0 0',
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const sub = style({
  margin: '6px 0 0',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

/** Everything sits on a quiet panel: white, quiet border, radius 20, no shadow. */
export const panel = style({
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[6],
  minWidth: 0,
});

export const panelPad = style([panel, { padding: 20 }]);

export const pad = style({ padding: '16px 20px' });

export const stack = style({ display: 'flex', flexDirection: 'column', gap: 14 });

/** The one hero per screen. */
export const hero = style({
  background: colors.white,
  border: borders.thick,
  borderRadius: radii[5],
  boxShadow: shadows.hero,
  padding: 22,
  minWidth: 0,
});

/** A form's hero: as wide as its fields, not the page. */
export const narrow = style({ maxWidth: 780 });

export const tiles = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
});

export const tileLabel = style([eyebrow, { marginBottom: 8 }]);

export const tileValue = style({
  display: 'block',
  fontSize: portalFontSizes.xl3,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const tileNote = style({
  display: 'block',
  marginTop: 6,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const row = style({ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' });

const buttonBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  minHeight: 44,
  padding: '0 18px',
  borderRadius: radii[2],
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  selectors: {
    '&:active:not(:disabled)': { transform: pressTransform.to, boxShadow: shadows.pressed },
    '&:disabled': {
      background: colors.gray100,
      color: colors.textMuted,
      boxShadow: 'none',
      cursor: 'not-allowed',
    },
  },
});

export const boton = styleVariants({
  primario: [
    buttonBase,
    {
      background: colors.yellow,
      color: colors.black,
      border: borders.thick,
      boxShadow: shadows.small,
      selectors: { '&:hover:not(:disabled)': { background: colors.yellowDeep } },
    },
  ],
  secundario: [buttonBase, { background: colors.white, color: colors.black, border: borders.thin }],
  quieto: [buttonBase, { background: colors.white, color: colors.gray600, border: borders.quiet }],
  peligro: [
    buttonBase,
    { background: colors.redSoft, color: colors.redText, border: borders.thin },
  ],
});

/** Filter chips: selected is black with yellow text, never a yellow fill. */
export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 36,
  padding: '0 14px',
  borderRadius: shapeRadii.pill,
  border: borders.thin,
  background: colors.white,
  color: colors.black,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  textDecoration: 'none',
  selectors: {
    '&[aria-current="true"]': { background: colors.black, color: colors.yellow },
  },
});

export const tag = styleVariants({
  ok: { background: colors.greenSoft, color: colors.greenText },
  off: { background: colors.gray100, color: colors.gray600 },
  info: { background: colors.blueSoft, color: colors.blueText },
});

export const tagBase = style({
  display: 'inline-block',
  padding: '3px 9px',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.wide,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
});

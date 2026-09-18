import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

const contentBox = { boxSizing: 'content-box' } as const;

/** «Todo al día»: the empty «Para hoy», inside the card (not the shared state). */
export const alDia = style({
  padding: '34px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 9,
  textAlign: 'center',
});

/** 52 px, radius 15 in the file; 16 until the upstream correction (ADR-076). */
export const alDiaTile = style({
  ...contentBox,
  width: 52,
  height: 52,
  display: 'grid',
  placeItems: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[4],
  background: colors.greenSoft,
  color: colors.greenText,
});

export const alDiaTitle = style({
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const alDiaBody = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const msgBody = style({
  marginTop: 3,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

export const msgTime = style({
  marginTop: 4,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
});

export const cortes = style({
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 11,
});

export const corteRow = style({ display: 'flex', alignItems: 'center', gap: 12 });

export const corteFecha = style({
  flex: 1,
  minWidth: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

export const cortesNota = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

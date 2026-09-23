import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii } from '@xangarro/tokens';

/** The aviso block reads as a notice, not a card: soft ground, thin border, no shadow. */
export const aviso = style({
  border: `2px solid ${colors.black}`,
  borderRadius: radii[1],
  background: colors.yellowSoft,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.4,
  color: colors.ink,
});

export const avisoTitle = style({ fontWeight: 700, fontSize: portalFontSizes.md });

export const check = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  fontSize: portalFontSizes.md,
  lineHeight: 1.4,
  color: colors.ink,
  cursor: 'pointer',
});

export const box = style({
  width: 20,
  height: 20,
  marginTop: 2,
  flexShrink: 0,
  accentColor: colors.black,
});

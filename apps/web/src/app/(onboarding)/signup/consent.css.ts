import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** The aviso reads as a notice, not a card: quiet ground, gray edge, no shadow. */
export const aviso = style({
  border: borders.quiet,
  borderRadius: radii[4],
  background: colors.offwhite,
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

export const avisoCabeza = style({ display: 'flex', alignItems: 'center', gap: 12 });

export const escudo = style({
  width: 36,
  height: 36,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  borderRadius: radii[1],
  background: colors.white,
  border: borders.quiet,
  color: colors.black,
});

export const avisoTitle = style({
  margin: 0,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

/** The full text, verbatim (it is what the ledger hashes), in a scrollable well. */
export const avisoTexto = style({
  maxHeight: 190,
  overflowY: 'auto',
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[2],
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  fontSize: portalFontSizes.sm,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  selectors: { '&:focus-visible': { outline: `3px solid ${colors.black}`, outlineOffset: 2 } },
});

export const parrafo = style({ margin: 0 });

export const lead = style({ fontWeight: typography.weights.extraBold });

export const checks = style({ display: 'flex', flexDirection: 'column', gap: 8 });

export const check = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '4px 0',
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  cursor: 'pointer',
});

export const box = style({
  width: 22,
  height: 22,
  margin: 0,
  flexShrink: 0,
  accentColor: colors.black,
  cursor: 'pointer',
});

export const opcional = style({ color: colors.textMuted });

export const enlace = style({ color: colors.black, fontWeight: typography.weights.extraBold });

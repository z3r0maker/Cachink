import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

/**
 * El Mostrador's tables and forms for «Empresa» (ADR-124): rows separated by
 * gray100 rules, fields with the black edge of «you can act on this».
 */

export const tableWrap = style({ overflowX: 'auto' });

export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: portalFontSizes.md,
  color: colors.ink,
});

export const th = style({
  padding: '12px',
  textAlign: 'left',
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.gray600,
  borderBottom: borders.quiet,
  whiteSpace: 'nowrap',
});

export const thNum = style([th, { textAlign: 'right' }]);

export const td = style({
  padding: '12px',
  borderBottom: `2px solid ${colors.gray100}`,
  verticalAlign: 'top',
  fontWeight: typography.weights.semibold,
});

export const tdStrong = style([td, { fontWeight: typography.weights.bold, color: colors.black }]);

export const tdNum = style([
  td,
  {
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: typography.weights.extraBold,
    whiteSpace: 'nowrap',
    color: colors.black,
  },
]);

export const tdIn = style([tdNum, { color: colors.greenText }]);

/** A row that opens its detail: the whole row is the target, not a bare text link. */
export const rowOpen = style({
  position: 'relative',
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: colors.offwhite },
    '&:focus-within': { outline: `3px solid ${colors.black}`, outlineOffset: -3 },
  },
});

export const rowLink = style({
  color: colors.black,
  fontWeight: typography.weights.extraBold,
  textDecoration: 'none',
  outline: 'none',
  selectors: { '&::after': { content: '""', position: 'absolute', inset: 0 } },
});

export const cellSub = style({
  display: 'block',
  marginTop: 3,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const empty = style({
  margin: 0,
  padding: '28px 20px',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const form = style({ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 720 });

export const fields = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16,
});

export const field = style({ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 });

export const label = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const hint = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const input = style({
  minHeight: 48,
  padding: '0 14px',
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.white,
  color: colors.black,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.semibold,
  selectors: { '&:focus-visible': { outline: `3px solid ${colors.yellow}`, outlineOffset: 1 } },
});

export const legend = style([label, { padding: 0, marginBottom: 8 }]);

export const fieldset = style({ border: 0, margin: 0, padding: 0, minWidth: 0 });

/** Option cards (≤ 5 choices, CLAUDE.md §6): selected is the yellow fill. */
export const options = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 10,
});

export const option = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '12px 14px',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.white,
  cursor: 'pointer',
  selectors: {
    '&:has(input:checked)': { background: colors.yellow, boxShadow: shadows.small },
    '&:has(input:focus-visible)': { outline: `3px solid ${colors.black}`, outlineOffset: 2 },
  },
});

export const optionInput = style({ position: 'absolute', opacity: 0, pointerEvents: 'none' });

export const optionTitle = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const optionText = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const message = style({
  margin: 0,
  padding: '12px 14px',
  borderRadius: radii[2],
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
});

export const messageBad = style([message, { background: colors.redSoft, color: colors.redText }]);

export const messageOk = style([
  message,
  { background: colors.greenSoft, color: colors.greenText },
]);

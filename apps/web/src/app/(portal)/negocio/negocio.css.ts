import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

export const pageTitle = style({
  margin: 0,
  fontSize: portalFontSizes.pageTitle,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const pageSubtitle = style({
  marginTop: 6,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const sectionGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
  gap: 16,
});

export const sectionHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 14,
});

export const sectionTile = style({
  width: 38,
  height: 38,
  flex: 'none',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  // The glyph inside it (D-1); `currentColor` gives it the tile's ink.
  display: 'grid',
  placeItems: 'center',
  color: colors.black,
});

export const sectionTitle = style({
  fontSize: portalFontSizes.cardTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const fieldRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  padding: '10px 0',
  borderBottom: `2px solid ${colors.gray200}`,
});

export const fieldLabel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

export const fieldValue = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.bold,
  color: colors.black,
  textAlign: 'right',
});

/** An unfilled value is amber, not blank — it is a thing to do, not an absence. */
export const fieldMissing = style([fieldValue, { color: colors.warningText }]);

export const flagRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 1fr) 110px 110px 110px',
  gap: 12,
  alignItems: 'center',
  padding: '14px 0',
  borderBottom: `2px solid ${colors.gray200}`,
});

export const flagHead = style([flagRow, { borderBottom: `2.5px solid ${colors.black}` }]);

export const colLabel = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
  textAlign: 'center',
});

export const cell = style({ display: 'grid', placeItems: 'center' });

/** Edit mode's save bar: sticky to the bottom of the viewport, yellow, never covering the last card. */
export const saveBar = style({
  position: 'sticky',
  top: 12,
  zIndex: 5,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
  padding: '14px 18px',
  background: colors.yellow,
  border: `2.5px solid ${colors.black}`,
  borderRadius: radii[3],
});

export const attrRow = style({ padding: '10px 0', borderBottom: `2px solid ${colors.gray200}` });

/** One line under a section title that says what the fields are for (P-36.4). */
export const hint = style([pageSubtitle, { margin: '0 0 12px' }]);

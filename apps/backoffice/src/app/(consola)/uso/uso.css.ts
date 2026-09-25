import { style, styleVariants } from '@vanilla-extract/css';
import { fontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

import { line, t } from '@/styles/theme.css';

const badgeBase = style({
  display: 'inline-block',
  marginLeft: 6,
  padding: '1px 6px',
  borderRadius: radii[2],
  border: line.thin,
  fontSize: fontSizes.xs,
  fontWeight: typography.weights.extraBold,
  color: t.text,
});

/** One badge per ADR-065 threshold; colour is backed by the text, never alone. */
export const badge = styleVariants({
  80: [badgeBase, { background: t.warnSoft }],
  100: [badgeBase, { background: t.badSoft }],
  150: [badgeBase, { background: t.bad, color: t.onAccent }],
  upgrade: [badgeBase, { background: t.infoSoft }],
});

/** Use against the limit, as a bar under the figure (a native <progress>: no inline widths). */
export const gauge = style({
  display: 'block',
  width: '100%',
  maxWidth: 220,
  height: 8,
  marginTop: 6,
  border: 0,
  borderRadius: shapeRadii.pill,
  overflow: 'hidden',
  background: t.raised,
  appearance: 'none',
  selectors: {
    '&::-webkit-progress-bar': { background: t.raised },
    '&::-webkit-progress-value': { background: t.accent, borderRadius: shapeRadii.pill },
    '&::-moz-progress-bar': { background: t.accent, borderRadius: shapeRadii.pill },
  },
});

/** The three counters on top of the page. */
export const counters = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 14,
  '@media': { 'screen and (max-width: 899px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

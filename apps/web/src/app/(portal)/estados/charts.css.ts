import { keyframes, style } from '@vanilla-extract/css';
import { colors, portalFontSizes, typography } from '@xangarro/tokens';

/**
 * Everything the Estados charts are made of (C-13), kept apart from the
 * screen's own stylesheet: the design's motion, the gauge cards and the two
 * legends. `estados.css.ts` was over its 200-line budget with these in it.
 */

/**
 * The design's own chart motion: flujo bars unroll over 520ms, the donut
 * sweeps over 420ms. Both are held under reduced motion,
 * where the mark simply appears at full size.
 */
const barrer = keyframes({
  from: { transform: 'rotate(-40deg)', opacity: 0 },
  to: { transform: 'rotate(0)', opacity: 1 },
});

export const barrido = style({
  animation: `${barrer} 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

/** The Flujo bars unroll sideways from the axis; the needle swings in. */
const crecerX = keyframes({
  from: { transform: 'scaleX(0)' },
  to: { transform: 'scaleX(1)' },
});

const girar = keyframes({
  from: { transform: 'rotate(-80deg)' },
  to: { transform: 'rotate(0)' },
});

export const creceX = style({
  transformBox: 'fill-box',
  animation: `${crecerX} 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const aguja = style({
  animation: `${girar} 760ms cubic-bezier(0.2, 0.8, 0.2, 1) both`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

/** The Indicadores grid: `minmax(300px, 1fr)`, as the design sets it. */
export const gaugeGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 16,
  alignItems: 'start',
});

export const gaugeRotulo = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  letterSpacing: typography.letterSpacing.wider,
  textTransform: 'uppercase',
  color: colors.gray600,
  textAlign: 'center',
});

export const gaugeCifra = style({
  fontSize: portalFontSizes.pageTitle,
  fontWeight: 800,
  letterSpacing: typography.letterSpacing.tightest,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  textAlign: 'center',
});

export const gaugeVeredicto = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginTop: 8,
  fontSize: portalFontSizes.md,
  fontWeight: 800,
  textWrap: 'pretty',
});

export const gaugePunto = style({
  width: 10,
  height: 10,
  flex: 'none',
  borderRadius: 9999,
  border: `2px solid ${colors.black}`,
});

export const gaugeSubtitulo = style({
  margin: '12px 0 0',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
  textAlign: 'center',
  textWrap: 'pretty',
});

/** The Flujo card's closing row: the period's net, ruled off at 2.5px. */
export const flujoNetoFila = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 16,
  marginTop: 16,
  paddingTop: 18,
  borderTop: `2.5px solid ${colors.black}`,
  flexWrap: 'wrap',
});

export const flujoNeto = style({
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: 800,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

export const flujoNetoCifra = style({
  // The design sets 32; the portal scale's nearest step is 34, which is also
  // the KPI figure's — a 2px snap next to an 18px label is invisible, and an
  // off-scale literal here would be the next one someone copies.
  fontSize: portalFontSizes.xl6,
  fontWeight: 800,
  letterSpacing: typography.letterSpacing.tighter,
  fontVariantNumeric: 'tabular-nums',
});

export const donutTitulo = style({
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: 800,
  letterSpacing: typography.letterSpacing.tight,
  margin: '0 0 14px',
  textWrap: 'pretty',
});

export const donutLista = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
});

export const donutFila = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  color: colors.black,
  // Without this the row cannot shrink below its text, and the amount — which
  // must not wrap — pushed the whole page 22 px wide at 1024 and 768 px
  // (`a11y.spec.ts`: the page itself never scrolls sideways).
  minWidth: 0,
});

/** The slice's name. It yields first, because the money must stay readable. */
export const donutEtiqueta = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const donutSwatch = style({
  width: 14,
  height: 14,
  flex: 'none',
  border: `2px solid ${colors.black}`,
  borderRadius: 4,
});

export const donutMonto = style({
  marginLeft: 'auto',
  flex: 'none',
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
  whiteSpace: 'nowrap',
});

export const chartNote = style({
  fontSize: portalFontSizes.xs,
  color: colors.gray600,
  margin: '8px 0 0',
});

export const donutGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 20,
  alignItems: 'start',
});

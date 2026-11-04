import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/**
 * Resumen (E-16, boards CD-12, CD-12b, CD-12c): the «Autonomía» hero, the
 * KPI tiles, the profit bars, signals and the next due items. The surfaces
 * themselves (hero, panel, buttons) come from `mostrador.css.ts`.
 */
export const heroCabeza = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
});

export const heroTitulo = style({
  margin: '6px 0',
  fontSize: portalFontSizes.xl6,
  lineHeight: 1.1,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

const insigniaBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 14px',
  borderRadius: radii[2],
  border: borders.thin,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
});

export const insignia = styleVariants({
  autosuficiente: [insigniaBase, { background: colors.greenSoft, color: colors.greenText }],
  fondeo: [insigniaBase, { background: colors.warningSoft, color: colors.warningText }],
});

export const tarjetas = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
  gap: 14,
});

const tarjetaBase = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '16px 18px',
  borderRadius: radii[3],
});

export const tarjeta = styleVariants({
  normal: [tarjetaBase, { background: colors.offwhite }],
  aviso: [tarjetaBase, { background: colors.warningSoft }],
});

export const tarjetaEtiqueta = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  selectors: { [`${tarjeta.aviso} &`]: { color: colors.warningText } },
});

export const cifra = style({
  fontSize: portalFontSizes.xl4,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
});

export const nota = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const pie = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  paddingTop: 12,
  borderTop: borders.quiet,
});

export const tenue = style({
  margin: 0,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

/** A KPI tile is a link to the screen that explains it. */
export const kpi = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '16px 18px',
  background: colors.white,
  border: borders.quiet,
  borderRadius: radii[6],
  color: colors.ink,
  textDecoration: 'none',
  selectors: { '&:hover': { borderColor: colors.black } },
});

export const cambio = styleVariants({
  bien: {
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.greenText,
  },
  mal: { fontSize: portalFontSizes.sm, fontWeight: typography.weights.bold, color: colors.redText },
  igual: {
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray600,
  },
});

export const ref = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const paneles = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
  gap: 20,
  alignItems: 'start',
});

export const panelCabeza = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
});

export const panelTitulo = style({
  margin: 0,
  fontSize: portalFontSizes.sectionTitle,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.black,
});

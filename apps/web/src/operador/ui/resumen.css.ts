import { style, styleVariants } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shapeRadii, typography } from '@xangarro/tokens';

/**
 * El Mostrador's quiet pieces shared by the list screens (`OpInventario`,
 * `OpCobranza`): the KPI row, the search field and the state chip.
 */
export const kpis = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
});

export const kpi = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
  padding: '14px 20px',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
});

export const eyebrow = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: colors.textMuted,
});

export const kpiValue = style({
  fontSize: portalFontSizes.xl5,
  lineHeight: 1.2,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tight,
});

export const kpiHint = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  textWrap: 'pretty',
});

export const search = style({
  flex: 1,
  minWidth: 220,
  height: 48,
  boxSizing: 'border-box',
  padding: '0 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: borders.quiet,
  borderRadius: radii[3],
  background: colors.white,
  color: colors.textMuted,
  selectors: {
    '&:focus-within': {
      outline: borders.thick,
      outlineColor: colors.yellow,
      borderColor: colors.black,
    },
  },
});

export const searchInput = style({
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  selectors: { '&:focus-visible': { outline: 'none', boxShadow: 'none' } },
});

const chipBase = {
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  border: borders.quiet,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  whiteSpace: 'nowrap',
} as const;

/** A state chip: soft ground, the text colour on its edge. */
export const chip = styleVariants({
  red: {
    ...chipBase,
    background: colors.redSoft,
    color: colors.redText,
    borderColor: colors.redText,
  },
  green: {
    ...chipBase,
    background: colors.greenSoft,
    color: colors.greenText,
    borderColor: colors.greenText,
  },
  amber: {
    ...chipBase,
    background: colors.warningSoft,
    color: colors.warningText,
    borderColor: colors.warningText,
  },
  gray: { ...chipBase, background: colors.gray100, color: colors.ink },
});

export type ChipTone = keyof typeof chip;

/** A quiet filter pill: black with yellow text when on. */
export const filtro = style({
  height: 44,
  padding: '0 16px',
  border: borders.quiet,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  selectors: {
    '&[aria-pressed="true"]': {
      borderColor: colors.black,
      background: colors.black,
      color: colors.yellow,
    },
  },
});

export const filtros = style({ display: 'flex', gap: 8, flexWrap: 'wrap' });

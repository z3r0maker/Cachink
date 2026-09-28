/**
 * Btn's variant and size tables, kept apart from the component so both stay
 * under the file budget.
 *
 * Two vocabularies live here. The older one (`dark`, `ghost`, `green`,
 * `soft`, `outline`, `danger`) belongs to screens that M-06..M-09 redraw. The
 * El Mostrador one (docs/design/el-mostrador.md §3, the caja's
 * `mostrador.css.ts` `boton`) is `primary`, `secondary`, `quiet`,
 * `destructive` and `destructiveFilled`; its labels are sentence case, 800.
 */
import {
  borderColors,
  borderWidths,
  colors,
  fontSizes,
  portalFontSizes,
  shadows,
} from '../../theme';

export type BtnVariant =
  | 'primary'
  | 'secondary'
  | 'quiet'
  | 'destructive'
  | 'destructiveFilled'
  | 'dark'
  | 'ghost'
  | 'green'
  | 'danger'
  | 'soft'
  | 'outline';

/** `xl` is El Mostrador's 56 px primary: the one action in the thumb zone. */
export type BtnSize = 'sm' | 'md' | 'lg' | 'xl';

export interface VariantStyle {
  readonly background: string;
  readonly color: string;
  readonly shadow: string;
  readonly borderWidth: number;
  readonly borderColor: string;
  /** El Mostrador variants speak in sentence case; the older ones shout. */
  readonly mostrador: boolean;
}

const black = { borderWidth: borderWidths.thin, borderColor: colors.black };
const legacy = { ...black, mostrador: false };

export const VARIANTS: Record<BtnVariant, VariantStyle> = {
  // Primary: yellow, the thick black edge and the hard shadow (§3).
  primary: {
    background: colors.yellow,
    color: colors.black,
    shadow: shadows.card,
    borderWidth: borderWidths.thick,
    borderColor: colors.black,
    mostrador: false,
  },
  secondary: {
    background: colors.white,
    color: colors.black,
    shadow: 'none',
    ...black,
    mostrador: true,
  },
  quiet: {
    background: colors.white,
    color: colors.gray600,
    shadow: 'none',
    borderWidth: borderWidths.quiet,
    borderColor: borderColors.quiet,
    mostrador: true,
  },
  destructive: {
    background: colors.white,
    color: colors.redText,
    shadow: 'none',
    borderWidth: borderWidths.thin,
    borderColor: colors.redText,
    mostrador: true,
  },
  destructiveFilled: {
    background: colors.redText,
    color: colors.white,
    shadow: shadows.small,
    ...black,
    mostrador: true,
  },
  dark: { background: colors.black, color: colors.white, shadow: shadows.card, ...legacy },
  ghost: { background: 'transparent', color: colors.black, shadow: 'none', ...legacy },
  green: { background: colors.green, color: colors.black, shadow: shadows.card, ...legacy },
  // Black label, not white: white on the brand red is 3.34:1 and fails WCAG
  // AA; black on it is 5.82:1. `tests/theme.test.ts` pins both. Audit 2026-09.
  danger: { background: colors.red, color: colors.black, shadow: shadows.card, ...legacy },
  soft: { background: colors.yellowSoft, color: colors.black, shadow: shadows.small, ...legacy },
  // The white-with-hard-border companion to `primary` (April 2026 review).
  outline: { background: colors.white, color: colors.black, shadow: shadows.card, ...legacy },
};

/** A disabled El Mostrador confirm: gray100, muted text, no shadow (§3). */
export const DISABLED_MOSTRADOR: VariantStyle = {
  background: colors.gray100,
  color: colors.textMuted,
  shadow: 'none',
  borderWidth: borderWidths.quiet,
  borderColor: borderColors.quiet,
  mostrador: true,
};

export interface SizeStyle {
  readonly height: number;
  readonly paddingX: number;
  readonly fontSize: number;
  /** The sentence-case label's size, a step up from the uppercase one. */
  readonly mostradorFontSize: number;
}

export const SIZES: Record<BtnSize, SizeStyle> = {
  // `sm` bumped 36 → 40 + hitSlop on root pushes the effective tap-target
  // over the 44×44 iOS HIG / Android Material target floor (P1C-M12-T04).
  sm: { height: 40, paddingX: 14, fontSize: fontSizes.xs, mostradorFontSize: portalFontSizes.md },
  md: { height: 44, paddingX: 18, fontSize: fontSizes.md, mostradorFontSize: portalFontSizes.body },
  lg: { height: 52, paddingX: 22, fontSize: fontSizes.lg, mostradorFontSize: portalFontSizes.body },
  xl: { height: 56, paddingX: 20, fontSize: fontSizes.lg, mostradorFontSize: portalFontSizes.lgx },
};

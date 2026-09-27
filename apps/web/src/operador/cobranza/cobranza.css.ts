import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shapeRadii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** Operador · Fiado y abonos (`OpCobranza.dc.html`): the bar and the client cards. */
export const barra = style({ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' });

export const cards = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))',
  gap: 16,
});

/** A quiet card; the open account's gets the black edge and the hard shadow. */
export const card = style({
  minWidth: 0,
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
  selectors: {
    '&[data-sel]': { border: borders.thick, boxShadow: shadows.hero },
  },
});

export const cabeza = style({ display: 'flex', alignItems: 'center', gap: 12 });

export const avatar = style({
  flex: 'none',
  width: 48,
  height: 48,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const quien = style({ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 });

export const nombre = style({
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const tel = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.textMuted,
});

export const saldoRow = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 10,
});

export const saldo = style({
  fontSize: portalFontSizes.xl6,
  lineHeight: 1,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: typography.letterSpacing.tight,
});

export const linea = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
  textWrap: 'pretty',
});

export const botones = style({ display: 'flex', gap: 8 });

const boton = {
  height: 48,
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  borderRadius: radii[3],
  fontFamily: 'inherit',
  fontWeight: typography.weights.extraBold,
  color: colors.black,
} as const;

export const abonar = style([
  pressable,
  {
    ...boton,
    flex: 1,
    border: borders.thin,
    background: colors.yellow,
    boxShadow: shadows.small,
    fontSize: portalFontSizes.body,
  },
]);

export const ver = style([
  pressable,
  {
    ...boton,
    border: borders.thin,
    background: colors.white,
    fontSize: portalFontSizes.md,
    selectors: { '&[data-solo]': { flex: 1, border: borders.quiet } },
  },
]);

/** Kept for Pendientes, which borrows this head for its queue. */
export const abonosHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 18px',
  background: colors.gray100,
  borderBottom: borders.thick,
});

/** «Abonos que recibiste hoy», under the cards. */
export const hoy = style({
  minWidth: 0,
  overflow: 'hidden',
  border: borders.quiet,
  borderRadius: radii[6],
  background: colors.white,
});

export const hoyHead = style({
  padding: '12px 20px',
  borderBottom: borders.quiet,
});

export const abonoRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  padding: '12px 20px',
  borderBottom: borders.quiet,
  borderBottomColor: colors.gray100,
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const abonoHora = style({
  flex: 'none',
  minWidth: 48,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.gray600,
});

export const abonoMonto = style({
  flex: 'none',
  marginLeft: 'auto',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.greenText,
});

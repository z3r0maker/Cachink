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

/** «Recordarle su saldo» (`OpRecordarSaldo.dc.html`): a centred dialog over the account. */
export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 70,
  display: 'grid',
  placeItems: 'center',
  padding: 16,
  overflowY: 'auto',
  background: colors.scrim,
});

export const card = style({
  width: '100%',
  maxWidth: 560,
  boxSizing: 'border-box',
  padding: '22px 28px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  border: borders.thick,
  borderRadius: radii[7],
  background: colors.white,
  boxShadow: shadows.hero,
  outline: 'none',
});

export const head = style({ display: 'flex', alignItems: 'flex-start', gap: 12 });

export const icono = style({
  flex: 'none',
  width: 48,
  height: 48,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.greenSoft,
  color: colors.greenText,
});

export const titulos = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.xl3,
  lineHeight: 1.2,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
});

export const campo = style({ display: 'flex', flexDirection: 'column', gap: 6 });

export const label = style({
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const tel = style({
  height: 50,
  boxSizing: 'border-box',
  padding: '0 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: borders.thin,
  borderRadius: radii[3],
  background: colors.white,
  selectors: {
    '&:focus-within': { outline: borders.thick, outlineColor: colors.blueText, outlineOffset: 2 },
  },
});

export const lada = style({
  paddingRight: 10,
  borderRight: borders.quiet,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.textMuted,
});

export const telInput = style({
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  selectors: { '&:focus-visible': { outline: 'none', boxShadow: 'none' } },
});

export const error = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.redText,
});

export const mensajeHead = style({ display: 'flex', alignItems: 'baseline', gap: 10 });

export const hint = style({
  marginLeft: 'auto',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.textMuted,
});

/** The chat: the message as the client gets it, a green bubble on the right. */
export const chat = style({
  padding: '16px 16px 14px 56px',
  border: borders.quiet,
  borderRadius: radii[5],
  background: colors.gray100,
});

export const burbuja = style({
  padding: '12px 14px 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  border: borders.thin,
  borderRadius: `${radii[5]}px ${shapeRadii.markLg}px ${radii[5]}px ${radii[5]}px`,
  background: colors.greenSoft,
  selectors: {
    '&:focus-within': { outline: borders.thick, outlineColor: colors.blueText, outlineOffset: 2 },
  },
});

export const textarea = style({
  width: '100%',
  boxSizing: 'border-box',
  resize: 'none',
  padding: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.body,
  lineHeight: 1.5,
  fontWeight: typography.weights.semibold,
  color: colors.black,
  selectors: { '&:focus-visible': { outline: 'none', boxShadow: 'none' } },
});

export const hora = style({
  alignSelf: 'flex-end',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  fontVariantNumeric: 'tabular-nums',
  color: colors.greenText,
});

export const restaurar = style({
  alignSelf: 'flex-start',
  minHeight: 44,
  padding: '0 4px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.blueText,
  textDecoration: 'underline',
});

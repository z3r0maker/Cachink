import { style } from '@vanilla-extract/css';
import { colors, portalFontSizes, radii, shapeRadii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/** Operador · Gastos (`Operador Gastos.dc.html`): rows and the «Registrar gasto» form. */
const contentBox = { boxSizing: 'content-box' } as const;

export const tile = style({
  ...contentBox,
  flex: 'none',
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: radii[2],
  color: colors.black,
});

/** «Con comprobante» green / «Sin comprobante» amber. */
export const proof = style({
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  border: `2px solid ${colors.black}`,
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.bold,
  whiteSpace: 'nowrap',
  background: colors.greenSoft,
  color: colors.greenText,
  selectors: { '&[data-sin]': { background: colors.warningSoft, color: colors.warningText } },
});

/** Header action as a native button: border-box, so 44 px includes the border. */
export const headerButton = style({ boxSizing: 'border-box', cursor: 'pointer' });

export const foto = style([
  pressable,
  {
    width: '100%',
    /* The file's 72 px content-box div, as a border-box button. */
    minHeight: 76,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 13,
    border: `2px solid ${colors.black}`,
    borderRadius: radii[3],
    background: colors.white,
    boxShadow: shadows.small,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    selectors: { '&[data-adjunto]': { background: colors.greenSoft } },
  },
]);

export const fotoTitle = style({
  display: 'block',
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const fotoHint = style({
  display: 'block',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

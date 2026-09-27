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
import { PHONE } from '../shell/shell.css';

/** Operador · Inicio (`OpInicio.dc.html`, `OpInicioSituaciones.dc.html`). */
const NARROW = 'screen and (max-width: 1179px)';

/* Don Cuentas' greeting ----------------------------------------------- */

export const greeting = style({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
  '@media': { [PHONE]: { gap: 2 } },
});

export const greetingText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
  flex: '1 1 200px',
});

export const bubble = style({
  position: 'relative',
  alignSelf: 'flex-start',
  padding: '12px 20px',
  border: borders.thin,
  borderRadius: radii[5],
  background: colors.white,
  boxShadow: shadows.small,
});

/** The tail pointing at Don: a rotated square showing two black edges. */
export const tail = style({
  position: 'absolute',
  left: -9,
  top: 22,
  width: 14,
  height: 14,
  background: colors.white,
  borderLeft: borders.thin,
  borderBottom: borders.thin,
  transform: 'rotate(45deg)',
});

export const h1 = style({
  margin: 0,
  fontSize: portalFontSizes.xl4,
  lineHeight: 1.15,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.black,
  textWrap: 'pretty',
  '@media': { [PHONE]: { fontSize: portalFontSizes.cardTitle } },
});

export const fecha = style({
  paddingLeft: 6,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
  '@media': { [PHONE]: { fontSize: portalFontSizes.sm } },
});

export const turnoChip = style({
  marginLeft: 'auto',
  alignSelf: 'flex-start',
  marginTop: 12,
  height: 34,
  padding: '0 14px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: borders.quiet,
  borderRadius: shapeRadii.pill,
  background: colors.white,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  '@media': { [PHONE]: { marginLeft: 0, marginTop: 4 } },
});

export const greenDot = style({
  width: 8,
  height: 8,
  borderRadius: shapeRadii.pill,
  background: colors.green,
});

export const grayDot = style({ background: colors.gray400 });

export const figure = style({ color: colors.black, fontWeight: typography.weights.extraBold });

export const mono = style({ fontVariantNumeric: 'tabular-nums' });

/* The two-column block ---------------------------------------------------- */

export const columns = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.38fr) minmax(0, 1fr)',
  gap: 16,
  alignItems: 'start',
  '@media': { [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

export const side = style({ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 });

export const tarea = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  padding: '12px 18px',
  borderBottom: `2px solid ${colors.gray100}`,
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const tareaText = style({
  flex: '1 1 200px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

export const tareaActions = style({ display: 'flex', gap: 8, flex: 'none', marginLeft: 'auto' });

/** «Nada más para hoy»: the emptied list, inside the panel. */
export const nada = style({
  padding: '32px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  textAlign: 'center',
});

export const nadaTitle = style({
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const verTodas = style([
  pressable,
  {
    marginLeft: 'auto',
    height: 40,
    padding: '0 12px',
    border: borders.quiet,
    borderRadius: radii[1],
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gray600,
  },
]);

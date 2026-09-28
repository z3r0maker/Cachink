import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  portalFontSizes,
  radii,
  shadows,
  shapeRadii,
  typography,
} from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** «¡Turno cerrado!» (OpCierreHecho): Don and the next steps, the corte beside them. */
export const hecho = style({
  padding: '8px 20px',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 440px',
  gap: 56,
  alignItems: 'center',
  '@media': {
    'screen and (max-width: 1179px)': { gridTemplateColumns: 'minmax(0, 1fr)', gap: 24 },
    [PHONE]: { padding: 0 },
  },
});

export const izquierda = style({ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 });

export const donFila = style({ display: 'flex', alignItems: 'flex-end', gap: 14 });

export const chip = style({
  marginBottom: 34,
  height: 36,
  padding: '0 14px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  borderWidth: 2,
  borderStyle: 'solid',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.md,
  fontWeight: typography.weights.extraBold,
});

export const titulo = style({
  margin: 0,
  fontSize: portalFontSizes.displayLg,
  lineHeight: 1.05,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.tightest,
  color: colors.black,
  '@media': { [PHONE]: { fontSize: portalFontSizes.xl5 } },
});

export const texto = style({
  margin: 0,
  maxWidth: 520,
  fontSize: portalFontSizes.lgx,
  lineHeight: 1.45,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  textWrap: 'pretty',
});

export const pasos = style({
  marginTop: 6,
  maxWidth: 520,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const entregar = style([
  pressable,
  {
    minHeight: 76,
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    border: borders.thick,
    borderRadius: radii[4],
    background: colors.yellow,
    boxShadow: shadows.card,
    fontFamily: 'inherit',
    textAlign: 'left',
    color: colors.black,
  },
]);

export const entregado = style({
  boxSizing: 'border-box',
  minHeight: 76,
  padding: '12px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  border: `2px solid ${colors.greenText}`,
  borderRadius: radii[4],
  background: colors.greenSoft,
  color: colors.greenText,
});

export const icono = style({
  flex: 'none',
  width: 44,
  height: 44,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  border: borders.thin,
  borderRadius: radii[2],
  background: colors.white,
});

export const iconoVerde = style({ background: colors.green, color: colors.black });

export const pasoTitulo = style({
  display: 'block',
  fontSize: portalFontSizes.lgx,
  fontWeight: typography.weights.extraBold,
});

export const pasoTexto = style({
  display: 'block',
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
});

export const botones = style({ display: 'flex', gap: 12, flexWrap: 'wrap' });

export const whatsapp = style([
  pressable,
  {
    flex: '1 1 260px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    border: borders.thin,
    borderRadius: radii[4],
    background: colors.white,
    boxShadow: shadows.small,
    fontSize: portalFontSizes.lg,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    textDecoration: 'none',
  },
]);

export const salir = style({
  flex: 'none',
  height: 56,
  padding: '0 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  border: borders.quiet,
  borderRadius: radii[4],
  background: colors.white,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.gray600,
  textDecoration: 'none',
});

/** «Pedro lo verá en su portal cuando se envíen los registros.» (DS-06, EsCajaCierre). */
export const porEnviar = style({
  margin: 0,
  maxWidth: 520,
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '12px 16px',
  border: `2px solid ${colors.warningText}`,
  borderRadius: radii[4],
  background: colors.warningSoft,
  lineHeight: 1.45,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.bold,
  color: colors.black,
});

export const porEnviarIcono = style({ display: 'inline-flex', color: colors.warningText });

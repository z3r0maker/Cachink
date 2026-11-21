import { style } from '@vanilla-extract/css';
import {
  borders,
  colors,
  fontSizes,
  portalFontSizes,
  radii,
  shadows,
  typography,
} from '@xangarro/tokens';

import { pressable } from '@/styles/press.css';

/** «Escríbele al equipo» (P-48, board `RpAyuda`): the form's card and what it holds. */
const NARROW = 'screen and (max-width: 639px)';

export const tarjeta = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  padding: '24px 28px',
  background: colors.white,
  border: borders.thin,
  borderRadius: radii[7],
  boxShadow: shadows.card,
  '@media': { [NARROW]: { padding: 18 } },
});

export const grupo = style({ display: 'flex', flexDirection: 'column' });

export const pregunta = style({
  padding: '0 0 10px',
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const opciones = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  '@media': { [NARROW]: { gridTemplateColumns: 'minmax(0, 1fr)' } },
});

/** A choice: white until chosen, then soft yellow under a thicker edge and a shadow. */
export const opcion = style([
  pressable,
  {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 16px',
    textAlign: 'left',
    font: 'inherit',
    color: colors.black,
    background: colors.white,
    border: borders.thin,
    borderRadius: radii[4],
    boxShadow: 'none',
    cursor: 'pointer',
    selectors: {
      '&[data-state="checked"]': {
        background: colors.yellowSoft,
        border: borders.thick,
        boxShadow: shadows.small,
      },
    },
  },
]);

export const opcionIcono = style({
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 'none',
  width: 40,
  height: 40,
  background: colors.white,
  border: borders.thin,
  borderRadius: radii[2],
});

export const opcionTexto = style({ display: 'flex', flexDirection: 'column', gap: 3 });

export const opcionTitulo = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
});

export const opcionDetalle = style({
  fontSize: portalFontSizes.sm,
  lineHeight: 1.4,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const campo = style({ display: 'flex', flexDirection: 'column' });

/** The message box: an input's edge and fill, as tall as four lines. */
export const texto = style({
  boxSizing: 'border-box',
  width: '100%',
  padding: '12px 14px',
  background: colors.offwhite,
  border: borders.thin,
  borderRadius: radii[2],
  fontFamily: typography.fontFamily,
  fontSize: fontSizes.lg,
  fontWeight: typography.weights.semibold,
  color: colors.ink,
  resize: 'none',
  selectors: {
    '&:focus': { borderWidth: 2.5, outline: 'none', background: colors.white },
    '&::placeholder': { color: colors.textMuted },
  },
});

/** «¿En qué pantalla?»: read, not pressed, so its edge is the quiet one. */
export const pantalla = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  padding: '12px 14px',
  background: colors.offwhite,
  border: borders.quiet,
  borderRadius: radii[3],
});

export const pantallaTexto = style({ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 });

export const pantallaEtiqueta = style({
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  letterSpacing: typography.letterSpacing.widest,
  textTransform: 'uppercase',
  color: colors.gray600,
});

export const pantallaNombre = style({
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

export const pantallaPista = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.gray600,
});

export const pantallas = style({ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' });

/** A screen to pick under «Fue en otra»; the picked one is black with yellow text. */
export const pantallaChip = style([
  pressable,
  {
    minHeight: 44,
    padding: '0 14px',
    background: colors.white,
    border: borders.thin,
    borderRadius: radii[2],
    boxShadow: 'none',
    font: 'inherit',
    fontSize: portalFontSizes.md,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    cursor: 'pointer',
    selectors: {
      '&[aria-pressed="true"]': { background: colors.black, color: colors.yellow },
    },
  },
]);

/** What travels with the report by itself. */
export const nota = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '10px 14px',
  background: colors.greenSoft,
  border: `2px solid ${colors.greenText}`,
  borderRadius: radii[2],
  fontSize: portalFontSizes.md,
  lineHeight: 1.45,
  fontWeight: typography.weights.bold,
  color: colors.ink,
});

export const notaIcono = style({ flex: 'none', marginTop: 2, color: colors.greenText });

export const urgente = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 44,
  fontSize: portalFontSizes.body,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  cursor: 'pointer',
});

export const urgenteCaja = style({
  flex: 'none',
  width: 24,
  height: 24,
  margin: 0,
  accentColor: colors.black,
  cursor: 'pointer',
});

export const acciones = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  flexWrap: 'wrap',
});

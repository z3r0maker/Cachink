import { keyframes, style, styleVariants } from '@vanilla-extract/css';
import { colors, portalFontSizes, shapeRadii, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from './shell.css';
import type { EstadoPill } from '@xangarro/caja';

/** DS-05's pill (EsCajaReintentando): its state's tone, border and ink alike. */
const base = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 40,
  boxSizing: 'border-box',
  padding: '0 14px',
  borderWidth: 2,
  borderStyle: 'solid',
  borderRadius: shapeRadii.pill,
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  whiteSpace: 'nowrap',
  textDecoration: 'none',
  '@media': { [PHONE]: { minHeight: 32, padding: '0 10px', gap: 6 } },
} as const;

export const enlace = style([pressable, base]);
export const fija = style(base);

const tono = (ink: string, fondo: string) => ({ color: ink, borderColor: ink, background: fondo });

export const estado = styleVariants<Record<EstadoPill, ReturnType<typeof tono>>>({
  'en-linea': tono(colors.greenText, colors.greenSoft),
  enviando: tono(colors.blueText, colors.blueSoft),
  reintentando: tono(colors.warningText, colors.warningSoft),
  'por-enviar': tono(colors.warningText, colors.warningSoft),
  'sin-conexion': tono(colors.gray600, colors.gray100),
  'con-rechazos': tono(colors.redText, colors.redSoft),
});

export const larga = style({ '@media': { [PHONE]: { display: 'none' } } });

export const corta = style({
  display: 'none',
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.extraBold,
  '@media': { [PHONE]: { display: 'inline' } },
});

const girar = keyframes({ to: { transform: 'rotate(360deg)' } });

export const gira = style({
  display: 'inline-flex',
  animation: `${girar} 1s linear infinite`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

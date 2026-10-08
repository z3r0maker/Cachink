import { keyframes, style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, shadows, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';

/**
 * The door's primary action (OpAcceso «Entrar», OpVincular «Conectar esta
 * caja», OpAbrirTurno «Abrir turno»): yellow with a hard shadow once the step
 * is complete, a pale quiet slab until then.
 */
export const primario = style([
  pressable,
  {
    width: '100%',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '0 18px',
    border: borders.thick,
    borderRadius: radii[4],
    background: colors.yellow,
    boxShadow: shadows.card,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.sectionTitle,
    fontWeight: typography.weights.extraBold,
    color: colors.black,
    selectors: {
      '&:disabled': {
        opacity: 1,
        border: borders.quiet,
        background: colors.yellowSoft,
        boxShadow: 'none',
        color: colors.textMuted,
      },
      '&[aria-busy="true"]:disabled': {
        border: borders.thick,
        color: colors.black,
        cursor: 'progress',
      },
    },
  },
]);

const girar = keyframes({ to: { transform: 'rotate(360deg)' } });

export const gira = style({
  display: 'inline-flex',
  animation: `${girar} 1s linear infinite`,
  '@media': { '(prefers-reduced-motion: reduce)': { animation: 'none' } },
});

export const falta = style({
  fontSize: portalFontSizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.textMuted,
  textAlign: 'center',
});

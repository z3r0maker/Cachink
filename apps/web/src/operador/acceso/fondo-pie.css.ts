import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

import { pressable } from '../../styles/press.css';
import { PHONE } from '../shell/shell.css';

/** OpAbrirTurno's footer: «Ahorita no», the confirm with the amount, the Enter hint. */

export const acciones = style({ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 });

export const ahoritaNo = style([
  pressable,
  {
    flex: 'none',
    height: 56,
    padding: '0 20px',
    border: borders.quiet,
    borderRadius: radii[3],
    background: colors.white,
    fontFamily: 'inherit',
    fontSize: portalFontSizes.body,
    fontWeight: typography.weights.extraBold,
    color: colors.gray600,
    '@media': { [PHONE]: { padding: '0 14px' } },
  },
]);

/** The confirm is `Continuar`, shorter and flexed beside «Ahorita no». */
export const abrir = style({ flex: 1, width: 'auto', height: 56, borderRadius: radii[3] });

export const tecla = style({
  alignSelf: 'flex-end',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: portalFontSizes.xs,
  fontWeight: typography.weights.bold,
  color: colors.textMuted,
  '@media': { [PHONE]: { display: 'none' } },
});

export const kbd = style({
  display: 'inline-flex',
  alignItems: 'center',
  height: 22,
  padding: '0 7px',
  border: borders.thin,
  borderBottomWidth: 3,
  borderRadius: radii[0],
  background: colors.white,
  fontFamily: 'inherit',
  fontSize: portalFontSizes.tag,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
});

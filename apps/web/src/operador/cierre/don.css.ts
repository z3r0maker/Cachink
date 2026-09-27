import { style } from '@vanilla-extract/css';
import { borders, colors, portalFontSizes, radii, typography } from '@xangarro/tokens';

/** Don Cuentas beside a white speech bubble whose tail points at him. */
export const dice = style({ display: 'flex', alignItems: 'center', gap: 10 });

export const bubble = style({
  position: 'relative',
  flex: 1,
  margin: 0,
  padding: '12px 16px',
  border: borders.thin,
  borderRadius: radii[4],
  background: colors.white,
  fontSize: portalFontSizes.lg,
  fontWeight: typography.weights.extraBold,
  color: colors.black,
  textWrap: 'pretty',
  selectors: {
    '&::before': {
      content: '""',
      position: 'absolute',
      left: -8,
      top: '50%',
      marginTop: -6,
      width: 12,
      height: 12,
      background: colors.white,
      borderLeft: borders.thin,
      borderBottom: borders.thin,
      transform: 'rotate(45deg)',
    },
  },
});

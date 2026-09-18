import { style } from '@vanilla-extract/css';
import { borders, colors, fontSizes, radii } from '@xangarro/tokens';

export const qr = style({
  width: 200,
  height: 200,
  alignSelf: 'center',
  background: colors.white,
  border: borders.thin,
  borderRadius: radii[2],
});

export const secret = style({
  fontSize: fontSizes.sm,
  wordBreak: 'break-all',
  color: colors.black,
});

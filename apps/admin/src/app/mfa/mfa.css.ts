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

export const codeList = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
  margin: 0,
  paddingLeft: 24,
  fontSize: fontSizes.sm,
  color: colors.black,
});

export const secret = style({
  fontSize: fontSizes.sm,
  wordBreak: 'break-all',
  color: colors.black,
});

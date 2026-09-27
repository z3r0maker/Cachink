import { style, styleVariants } from '@vanilla-extract/css';
import { colors, shapeRadii } from '@xangarro/tokens';

export const tira = style({ display: 'flex', alignItems: 'center', gap: 10 });

export const barra = style({ display: 'flex', gap: 4, flex: 'none' });

const base = { width: 34, height: 6, borderRadius: shapeRadii.pill } as const;

export const segmento = styleVariants({
  neutra: { ...base, background: colors.gray200 },
  mal: { ...base, background: colors.redText },
  media: { ...base, background: colors.warning },
  bien: { ...base, background: colors.green },
});

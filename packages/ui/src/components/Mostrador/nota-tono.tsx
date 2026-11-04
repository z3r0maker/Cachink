/**
 * NotaTono — a tinted note with a glyph (MvDesvincularBorrar): green when
 * something is done or safe, amber when the person must act first. The
 * optional children sit under the text (the amber note's «Enviar ahora»).
 */
import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import { borderWidths, colors, radii } from '../../theme';
import { GLYPHS } from '../PathIcon/glyphs';
import { PathIcon } from '../PathIcon/path-icon';
import { MText } from './mtext';

const ALERTA =
  'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01';

const TONOS = {
  verde: { fondo: colors.greenSoft, borde: colors.greenText, glifo: GLYPHS.check },
  ambar: { fondo: colors.warningSoft, borde: colors.warningText, glifo: ALERTA },
} as const;

export function NotaTono(props: {
  readonly tono: keyof typeof TONOS;
  readonly titulo: string;
  readonly cuerpo?: string;
  readonly children?: ReactNode;
  readonly testID?: string;
}): ReactElement {
  const t = TONOS[props.tono];
  return (
    <View
      testID={props.testID}
      role={props.tono === 'ambar' ? 'alert' : 'status'}
      gap={10}
      padding={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={t.borde}
      backgroundColor={t.fondo}
    >
      <View flexDirection="row" alignItems="flex-start" gap={10}>
        <PathIcon d={t.glifo} size={20} strokeWidth={2.4} color={t.borde} />
        <View flex={1} gap={2}>
          <MText
            size="md"
            weight="extraBold"
            color={props.tono === 'verde' ? colors.greenText : colors.black}
          >
            {props.titulo}
          </MText>
          {props.cuerpo ? (
            <MText size="sm" weight="semibold">
              {props.cuerpo}
            </MText>
          ) : null}
        </View>
      </View>
      {props.children}
    </View>
  );
}

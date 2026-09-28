/**
 * The escáner's camera where there is none (web, Storybook, tests): the dark
 * viewfinder and a line saying to type the code below. Metro picks
 * `escaner-camara.native.tsx` on the phone.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { MText } from '../../components/Mostrador/index';
import { colors, radii } from '../../theme';
import type { EscanerCamaraProps } from './escaner-camara.shared';
import { EscanerVisor } from './escaner-visor';

export function EscanerCamara(_props: EscanerCamaraProps): ReactElement {
  return (
    <View
      testID="escaner-camara"
      position="relative"
      height={240}
      borderRadius={radii[4]}
      overflow="hidden"
      backgroundColor={colors.ink}
    >
      <EscanerVisor />
      <View position="absolute" left={12} right={12} bottom={12}>
        <MText size="sm" weight="bold" color={colors.gray200} textAlign="center">
          Aquí no hay cámara. Escribe los números del código.
        </MText>
      </View>
    </View>
  );
}

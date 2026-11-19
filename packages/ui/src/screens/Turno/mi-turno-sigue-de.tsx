/**
 * «Sigues el turno de Ana. Lo abrió a las 08:15.» (M-21, MvTurnoDeOtro):
 * Mi turno's line while the operator continues the turno someone else opened
 * on this caja. The rest of Mi turno is the caja's turno as it always reads.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { sigueElTurnoDe } from '@xangarro/caja/turno';
import { InicialesBadge, MText } from '../../components/Mostrador/index';
import { borderWidths, colors, radii } from '../../theme';
import { inicialesDe } from '../AppShell/use-shell-data';

export function SigueDe(p: { readonly titular: string; readonly desde: string }): ReactElement {
  return (
    <View
      testID="turno-sigue-de"
      role="status"
      marginTop={8}
      flexDirection="row"
      alignItems="center"
      gap={10}
      paddingHorizontal={12}
      paddingVertical={10}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <InicialesBadge iniciales={inicialesDe(p.titular)} size={30} />
      <MText size="sm" weight="bold" flex={1}>
        {sigueElTurnoDe(p.titular, p.desde)}
      </MText>
    </View>
  );
}

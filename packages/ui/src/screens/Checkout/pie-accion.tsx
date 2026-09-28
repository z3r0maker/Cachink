/**
 * The pinned foot of the cobro screens (MvCobro, MvFiado): what went wrong,
 * if anything, over the one yellow action in the thumb zone.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { borderColors, borderWidths, colors } from '../../theme';

export function PieAccion(p: {
  readonly label: string;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly error: string | null;
  readonly onPress: () => void;
  readonly testID: string;
}): ReactElement {
  return (
    <View
      padding={16}
      gap={8}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      {p.error ? (
        <MText role="alert" size="md" weight="bold" color={colors.redText}>
          {p.error}
        </MText>
      ) : null}
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        disabled={p.disabled}
        loading={p.loading}
        onPress={p.onPress}
        testID={p.testID}
      >
        {p.label}
      </Btn>
    </View>
  );
}

/**
 * AbrirCajaHeader — header card for the "abrir caja" modal.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Card } from '../../components/Card/card';
import { Icon } from '../../components/Icon/index';
import type { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';

export function AbrirCajaHeader({
  t,
}: {
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <Card variant="white" padding="md" fullWidth testID="abrir-caja-header">
      <View flexDirection="row" alignItems="center" gap={10}>
        <Icon name="landmark" size={28} color={colors.greenText} />
        <View flex={1} gap={2}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={'900'}
            fontSize={fontSizes.xl}
            color={colors.black}
            children={t('caja.abrirQuestion') as string}
          />
          <Text
            fontFamily={typography.fontFamily}
            fontSize={fontSizes.md}
            color={colors.gray600}
            children={t('caja.abrirHint') as string}
          />
        </View>
      </View>
    </Card>
  );
}

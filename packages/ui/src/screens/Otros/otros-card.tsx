/**
 * OtrosCard — single card in the Otros grid.
 *
 * Colored icon + label. Tapping navigates to the card's route.
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import { Card, Icon } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import type { OtrosItem } from './otros-items';

export interface OtrosCardProps {
  readonly item: OtrosItem;
  readonly onPress: () => void;
  readonly testID: string;
}

export function OtrosCard(props: OtrosCardProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Pressable onPress={props.onPress} testID={props.testID}>
      <Card variant="white" padding="md">
        <View alignItems="center" gap={8} padding={8}>
          <Icon name={props.item.icon} size={28} color={colors.black} />
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.semibold}
            fontSize={13}
            color={colors.black}
            textAlign="center"
            numberOfLines={2}
          >
            {t(props.item.labelKey as never)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

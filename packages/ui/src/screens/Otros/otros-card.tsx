/**
 * OtrosCard — single card in the Otros grid.
 *
 * Yellow icon badge + bold title + gray description. Tapping navigates
 * to the card's route.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Card, Icon } from '../../components/index';
import type { IconName } from '../../components/Icon/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import type { OtrosItem } from './otros-items';

export interface OtrosCardProps {
  readonly item: OtrosItem;
  readonly onPress: () => void;
  readonly testID: string;
}

/** 36×36 yellow rounded-square badge with an icon centered inside. */
function IconBadge({ icon }: { readonly icon: IconName }): ReactElement {
  return (
    <View
      alignItems="center"
      justifyContent="center"
      width={36}
      height={36}
      borderRadius={10}
      backgroundColor={colors.yellow}
    >
      <Icon name={icon} size={20} color={colors.black} />
    </View>
  );
}

export function OtrosCard(props: OtrosCardProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Card
      variant="white"
      padding="md"
      elevation="raised"
      onPress={props.onPress}
      testID={props.testID}
      style={{ flex: 1 }}
    >
      <View gap={10}>
        <IconBadge icon={props.item.icon} />
        <View gap={2}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={14}
            color={colors.black}
            numberOfLines={1}
          >
            {t(props.item.labelKey as never)}
          </Text>
          {props.item.descriptionKey != null && (
            <Text
              fontFamily={typography.fontFamily}
              fontWeight={typography.weights.medium}
              fontSize={12}
              color={colors.gray600}
              numberOfLines={2}
            >
              {t(props.item.descriptionKey as never)}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}

/**
 * CachinkSoundToggle — Settings card letting the user enable / disable
 * the "¡CACHINK!" cash register sound that plays on each sale.
 *
 * Follows the same pattern as `NotificationsToggle`: pure UI driven
 * by props. The parent route handles the AppConfig persistence.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card, Icon } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface CachinkSoundToggleProps {
  readonly enabled: boolean;
  readonly onChange: (next: boolean) => void;
  readonly testID?: string;
}

function SoundLabel(props: { label: string; hint: string }): ReactElement {
  return (
    <View flex={1}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={12}
        letterSpacing={typography.letterSpacing.wide}
        color={colors.gray600}
        style={{ textTransform: 'uppercase' }}
      >
        {props.label}
      </Text>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.medium} fontSize={14} color={colors.gray600} marginTop={4}>
        {props.hint}
      </Text>
    </View>
  );
}

export function CachinkSoundToggle(props: CachinkSoundToggleProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Card testID={props.testID ?? 'settings-cachink-sound-toggle'} padding="md" fullWidth>
      <View flexDirection="row" justifyContent="space-between" alignItems="center" gap={12}>
        <View flexDirection="row" alignItems="center" gap={10} flex={1} paddingRight={12}>
          <Icon name="bell" size={20} color={props.enabled ? colors.black : colors.gray400} />
          <SoundLabel label={t('settings.cachinkSoundLabel')} hint={t('settings.cachinkSoundHint')} />
        </View>
        <Btn variant={props.enabled ? 'green' : 'ghost'} size="sm" onPress={() => props.onChange(!props.enabled)} testID="settings-cachink-sound-btn">
          {props.enabled ? t('common.yes') : t('common.no')}
        </Btn>
      </View>
    </Card>
  );
}

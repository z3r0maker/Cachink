/**
 * The avisos bell (the web caja's header `Bell`): a 44 px square with the
 * black edge and the small shadow, the unread count in a yellow badge. Shown
 * when the frame is given an avisos source: the phone's route wrapper passes
 * the owner's unread messages (`useAvisosSinLeer`) and opens Avisos (M-09).
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { ICONS } from '@xangarro/caja';
import { MText, PathIcon } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';

export interface AvisosSource {
  readonly count: number;
  readonly onPress: () => void;
}

const SQUARE = {
  width: 44,
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  borderRadius: radii[3],
  backgroundColor: colors.white,
  boxShadow: shadows.small,
} as const;

function Count({ n }: { n: number }): ReactElement {
  return (
    <View
      position="absolute"
      top={-7}
      right={-7}
      minWidth={22}
      height={22}
      paddingHorizontal={5}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.yellow}
    >
      <MText size="xs" weight="extraBold">
        {n}
      </MText>
    </View>
  );
}

export function AvisosBell({ count, onPress }: AvisosSource): ReactElement {
  const { t } = useTranslation();
  return (
    <Pressable
      testID="avisos-bell"
      role="button"
      aria-label={t('shell.avisos', { count })}
      onPress={onPress}
      style={SQUARE}
    >
      <PathIcon d={ICONS.bell} size={21} strokeWidth={2.3} />
      {count > 0 ? <Count n={count} /> : null}
    </Pressable>
  );
}

/**
 * OfflineBanner — the strip under the header while the caja has no internet
 * (MvEstados «Sin internet»): amber ground, a black rule under it, the
 * crossed-out Wi-Fi in a white circle, then what to do (keep selling) and
 * what happens (it is saved here and sent on its own). Never blocks capture
 * (CLAUDE.md §2.2); severity is carried by the icon and the words, not the
 * colour alone (§9).
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { borderWidths, colors, shapeRadii } from '../../theme';
import { useTranslation } from '../../i18n/index';
import { MText } from '../Mostrador/mtext';
import { GLYPHS } from '../PathIcon/glyphs';
import { PathIcon } from '../PathIcon/path-icon';

export interface OfflineBannerProps {
  /** Records waiting on this device, when known. */
  readonly pendientes?: number;
  readonly testID?: string;
}

function Glyph(): ReactElement {
  return (
    <View
      width={32}
      height={32}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <PathIcon d={GLYPHS.sinRed} size={16} strokeWidth={2.4} color={colors.warningText} />
    </View>
  );
}

export function OfflineBanner(props: OfflineBannerProps): ReactElement {
  const { t } = useTranslation();
  const n = props.pendientes ?? 0;
  const body = n > 0 ? t('shell.offline.bodyCount', { count: n }) : t('shell.offline.body');
  return (
    <View
      testID={props.testID ?? 'offline-banner'}
      role="status"
      aria-live="polite"
      flexDirection="row"
      alignItems="center"
      gap={10}
      paddingHorizontal={16}
      paddingVertical={10}
      backgroundColor={colors.warningSoft}
      borderBottomWidth={borderWidths.thin}
      borderBottomColor={colors.black}
    >
      <Glyph />
      <View flex={1} minWidth={0}>
        <MText weight="extraBold">{t('shell.offline.title')}</MText>
        <MText size="sm" weight="semibold" color={colors.ink}>
          {body}
        </MText>
      </View>
    </View>
  );
}

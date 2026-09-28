/**
 * «Terminando de descargar el inventario…» (EsMvInventarioBajando): a slim
 * amber band under the top bar while the snapshot's last pages are still to
 * come, so a low stock reads as not there yet, not as gone (DS-10).
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { TERMINANDO_INVENTARIO } from '@xangarro/caja';
import { MText, PathIcon } from '../../components/index';
import { borderWidths, colors } from '../../theme';

/** A three-quarter ring: still coming. */
const ARO = 'M21 12a9 9 0 1 1-6.219-8.56';

export function InventarioBajando(): ReactElement {
  return (
    <View
      role="status"
      aria-live="polite"
      testID="inventario-bajando"
      flexDirection="row"
      alignItems="center"
      gap={10}
      minHeight={40}
      paddingHorizontal={16}
      paddingVertical={8}
      backgroundColor={colors.warningSoft}
      borderBottomWidth={borderWidths.thin}
      borderBottomColor={colors.warningText}
    >
      <PathIcon d={ARO} size={16} strokeWidth={2.6} color={colors.warningText} />
      <MText flex={1} size="sm" weight="extraBold" color={colors.black}>
        {TERMINANDO_INVENTARIO}
      </MText>
    </View>
  );
}

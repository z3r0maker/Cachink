/**
 * AbrirCajaFooter — sticky bottom CTA for Abrir Caja numpad screen.
 *
 * Renders "Abrir turno · $X" pinned at the bottom of the screen so it's
 * always reachable on small phones where the numpad scrolls.
 *
 * Split from abrir-caja-modal.tsx to stay under the 200-line cap.
 * Follows the same pattern as checkout-footer.tsx.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn } from '../../components/Btn/btn';
import { Icon } from '../../components/Icon/index';
import { colors } from '../../theme';

export interface AbrirCajaFooterProps {
  /** CTA button label (e.g. "Abrir turno · $500.00"). */
  readonly buttonLabel: string;
  readonly canSubmit: boolean;
  readonly submitting: boolean;
  readonly onSubmit: () => void;
  readonly testID?: string;
}

export function AbrirCajaFooter(
  props: AbrirCajaFooterProps,
): ReactElement {
  return (
    <View
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      backgroundColor={colors.offwhite}
      paddingHorizontal={20}
      paddingVertical={16}
      borderTopWidth={2}
      borderTopColor={colors.gray200}
    >
      <Btn
        variant="dark"
        fullWidth
        size="lg"
        icon={<Icon name="check" size={18} color={colors.white} />}
        onPress={props.onSubmit}
        disabled={!props.canSubmit}
        loading={props.submitting}
        testID={props.testID ?? 'caja-abrir-submit'}
      >
        {props.buttonLabel}
      </Btn>
    </View>
  );
}

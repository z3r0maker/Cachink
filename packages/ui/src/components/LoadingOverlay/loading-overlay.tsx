/**
 * LoadingOverlay — full-screen semi-transparent overlay with centered spinner.
 *
 * Uses React Native's `Modal` component to guarantee the overlay covers the
 * entire screen regardless of where it's rendered in the component tree.
 * Shows a large spinner (xl = 120px) in a white neobrutalist card, with an
 * optional message. Blocks all touch interaction underneath.
 *
 * Used for PIN auth, demo seeding, and any future blocking async operation.
 */

import type { ReactElement } from 'react';
import { Modal, StyleSheet } from 'react-native';
import { Text, View } from '@tamagui/core';
import { Spinner } from '../Spinner/index';
import { colors, fontSizes, radii, typography } from '../../theme';

export interface LoadingOverlayProps {
  /** Whether the overlay is visible. */
  readonly visible: boolean;
  /** Optional status message below the spinner. */
  readonly message?: string;
  readonly testID?: string;
}

const BACKDROP_COLOR = colors.scrim;
const CARD_SIZE = 200;

export function LoadingOverlay(props: LoadingOverlayProps): ReactElement {
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      testID={props.testID ?? 'loading-overlay'}
    >
      <View style={styles.backdrop}>
        <View
          backgroundColor={colors.white}
          borderRadius={radii[4]}
          borderWidth={2}
          borderColor={colors.black}
          width={CARD_SIZE}
          alignItems="center"
          justifyContent="center"
          paddingVertical={32}
          paddingHorizontal={24}
          gap={16}
        >
          <Spinner size="xl" testID="loading-overlay-spinner" />
          {props.message != null && (
            <Text
              fontFamily={typography.fontFamily}
              fontWeight={typography.weights.semibold.toString()}
              fontSize={fontSizes.lg}
              color={colors.gray600}
              textAlign="center"
            >
              {props.message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: BACKDROP_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

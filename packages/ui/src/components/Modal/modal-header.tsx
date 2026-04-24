/**
 * Internal header used by both `modal.native.tsx` and `modal.web.tsx`.
 *
 * Extracted into its own file so both platform variants render an identical
 * header without duplication (CLAUDE.md §2.3 — code lives in exactly one
 * place). It's an internal — not re-exported from the package barrel — so
 * consumers always reach it via the `<Modal>` surface.
 *
 * Renders an optional emoji inside a 44×44 yellow-bordered square, an
 * optional title in the neobrutalist heading style, and a black X close
 * button that fires `onClose`. If both `title` and `emoji` are omitted,
 * only the close button shows — matching the `WithoutHeader` story.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, radii, typography } from '../../theme';

export interface ModalHeaderProps {
  readonly title?: string;
  readonly emoji?: string;
  readonly onClose: () => void;
}

const EMOJI_BOX_RADIUS = radii[1]; // 10
const CLOSE_BUTTON_RADIUS = radii[1]; // 10

function EmojiBox({ emoji }: { emoji: string }): ReactElement {
  return (
    <View
      testID="modal-emoji"
      backgroundColor={colors.yellow}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={EMOJI_BOX_RADIUS}
      width={44}
      height={44}
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize={22}>{emoji}</Text>
    </View>
  );
}

function Title({ text }: { text: string }): ReactElement {
  return (
    <Text
      color={colors.black}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.black}
      fontSize={20}
      letterSpacing={typography.letterSpacing.tight}
    >
      {text}
    </Text>
  );
}

function CloseButton({ onClose }: { onClose: () => void }): ReactElement {
  return (
    <View
      testID="modal-close"
      onPress={onClose}
      backgroundColor={colors.black}
      borderRadius={CLOSE_BUTTON_RADIUS}
      width={32}
      height={32}
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      style={{ userSelect: 'none' }}
    >
      <Text
        color={colors.white}
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={18}
      >
        ✕
      </Text>
    </View>
  );
}

export function ModalHeader(props: ModalHeaderProps): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      gap={12}
      marginBottom={16}
    >
      <View flexDirection="row" alignItems="center" gap={12} flex={1}>
        {props.emoji !== undefined && <EmojiBox emoji={props.emoji} />}
        {props.title !== undefined && <Title text={props.title} />}
      </View>
      <CloseButton onClose={props.onClose} />
    </View>
  );
}

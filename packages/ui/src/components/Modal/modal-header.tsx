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
import type { ReactElement, ReactNode } from 'react';
import { Text, View } from '@tamagui/core';
import { Icon } from '../Icon/index';
import { colors, radii, typography } from '../../theme';

export interface ModalHeaderProps {
  readonly title?: string;
  /**
   * Optional muted line beneath the title (mock 3 — `"24 abr · 10:48"`).
   * Renders only when provided.
   */
  readonly subtitle?: string;
  /**
   * Optional left-slot ReactNode (e.g. `<InitialsAvatar />`). Wins over
   * `emoji` when both are provided.
   */
  readonly leftAvatar?: ReactNode;
  /** @deprecated Use `leftAvatar` instead. Back-compat slot. */
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
      testID="modal-title"
      color={colors.black}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.black}
      fontSize={20}
      letterSpacing={typography.letterSpacing.tight}
      // Audit 9.3 — modal titles like "Registrar pago de cliente"
      // can exceed the modal-header width minus the close button +
      // avatar slots. Cap to one line + ellipsis.
      numberOfLines={1}
      ellipsizeMode="tail"
      // Audit 9.4 — modal headers compete with the close button for
      // the same row; cap at 1.3× to preserve the §8 row geometry.
      maxFontSizeMultiplier={1.3}
    >
      {text}
    </Text>
  );
}

function Subtitle({ text }: { text: string }): ReactElement {
  return (
    <Text
      testID="modal-subtitle"
      color={colors.gray600}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.semibold}
      fontSize={12}
      marginTop={2}
      // Audit 9.3 — subtitles ("24 abr · 10:48") are short but the
      // header is also short. Cap to one line + ellipsis to preserve
      // the row.
      numberOfLines={1}
      ellipsizeMode="tail"
      // Audit 9.4 — secondary chrome; cap at 1.5×.
      maxFontSizeMultiplier={1.5}
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
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      data-hit-slop='{"top":6,"bottom":6,"left":6,"right":6}'
      backgroundColor={colors.black}
      borderRadius={CLOSE_BUTTON_RADIUS}
      width={32}
      height={32}
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      style={{ userSelect: 'none' }}
    >
      <Icon name="x" size={18} color={colors.white} />
    </View>
  );
}

interface LeftSlotProps {
  readonly leftAvatar?: ReactNode;
  readonly emoji?: string;
}

function LeftSlot(props: LeftSlotProps): ReactElement | null {
  if (props.leftAvatar !== undefined) {
    return <View testID="modal-left-avatar">{props.leftAvatar}</View>;
  }
  if (props.emoji !== undefined) {
    return <EmojiBox emoji={props.emoji} />;
  }
  return null;
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
        <LeftSlot leftAvatar={props.leftAvatar} emoji={props.emoji} />
        <View flex={1}>
          {props.title !== undefined && <Title text={props.title} />}
          {props.subtitle !== undefined && <Subtitle text={props.subtitle} />}
        </View>
      </View>
      <CloseButton onClose={props.onClose} />
    </View>
  );
}

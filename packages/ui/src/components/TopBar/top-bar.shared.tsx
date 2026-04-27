import type { ReactElement, ReactNode } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, typography } from '../../theme';

export interface TopBarProps {
  /** Optional title — weight 900, tight tracking. */
  readonly title?: string;
  /** Optional subtitle — rendered under the title (e.g. "abril 2026"). */
  readonly subtitle?: string;
  /** Left slot — back button, role chip, etc. */
  readonly left?: ReactNode;
  /** Right slot — settings cog, sync-state chip, etc. */
  readonly right?: ReactNode;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

const HEIGHT = 72;
const SLOT_MIN_WIDTH = 44; // tap-target floor

function Title({ text }: { text: string }): ReactElement {
  return (
    <Text
      testID="top-bar-title"
      role="heading"
      aria-level={1}
      color={colors.black}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.black}
      fontSize={20}
      letterSpacing={typography.letterSpacing.tight}
      textAlign="center"
      // Audit 9.3 — top-bar titles like the Director greeting
      // ("Buenos días, Pedro Espinoza") can exceed the centre slot's
      // width on a phone. Cap to one line + ellipsis.
      numberOfLines={1}
      ellipsizeMode="tail"
      // Audit 9.4 — the 72-pt top-bar height is fixed; cap font
      // scaling at 1.3× so high Dynamic Type doesn't overflow the
      // bar.
      maxFontSizeMultiplier={1.3}
    >
      {text}
    </Text>
  );
}

function Subtitle({ text }: { text: string }): ReactElement {
  return (
    <Text
      testID="top-bar-subtitle"
      color={colors.gray600}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.semibold}
      fontSize={12}
      textAlign="center"
      marginTop={2}
      // Audit 9.3 — subtitles ("abril 2026 · 4 dispositivos") can
      // exceed the centre slot's width. Cap to one line + ellipsis.
      numberOfLines={1}
      ellipsizeMode="tail"
      // Audit 9.4 — secondary chrome; cap at 1.5× so it scales a bit
      // more freely than the title before truncation kicks in.
      maxFontSizeMultiplier={1.5}
    >
      {text}
    </Text>
  );
}

interface TopBarFrameProps extends TopBarProps {
  readonly paddingTop?: number;
}

export function TopBarFrame(props: TopBarFrameProps): ReactElement {
  return (
    <View
      testID={props.testID ?? 'top-bar'}
      flexDirection="row"
      alignItems="center"
      height={HEIGHT}
      paddingTop={props.paddingTop}
      paddingHorizontal={16}
      backgroundColor={colors.white}
      borderBottomWidth={2.5}
      borderBottomColor={colors.black}
    >
      <View
        testID="top-bar-left"
        minWidth={SLOT_MIN_WIDTH}
        alignItems="flex-start"
        justifyContent="center"
      >
        {props.left}
      </View>
      <View flex={1} alignItems="center" justifyContent="center">
        {props.title !== undefined && <Title text={props.title} />}
        {props.subtitle !== undefined && <Subtitle text={props.subtitle} />}
      </View>
      <View
        testID="top-bar-right"
        minWidth={SLOT_MIN_WIDTH}
        alignItems="flex-end"
        justifyContent="center"
      >
        {props.right}
      </View>
    </View>
  );
}

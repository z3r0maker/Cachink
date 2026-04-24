/**
 * TopBar — the Cachink sticky-header primitive.
 *
 * Fixed-position top shell rendered on every screen. Holds three slots:
 * `left` (back button, role chip, greeting), a centered title block with
 * optional subtitle, and `right` (settings cog, sync-state chip). The
 * subtitle uses §8.2 body voice; the title uses §8.2 heading voice
 * (weight 900, tight tracking).
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop. The
 * mobile shell wraps this in `SafeAreaView`; the desktop shell mounts it
 * directly inside the window chrome.
 *
 * All visual values come from `../../theme` — no inline hex codes.
 */
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
      color={colors.black}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.black}
      fontSize={20}
      letterSpacing={typography.letterSpacing.tight}
      textAlign="center"
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
    >
      {text}
    </Text>
  );
}

/**
 * Renders the canonical Cachink sticky top bar. See `top-bar.stories.tsx`
 * for the full variant catalog.
 */
export function TopBar(props: TopBarProps): ReactElement {
  return (
    <View
      testID={props.testID ?? 'top-bar'}
      flexDirection="row"
      alignItems="center"
      height={HEIGHT}
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

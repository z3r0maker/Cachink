/**
 * HelloBadge — Phase 0 proof-of-pipeline component.
 *
 * Rendered identically by `apps/mobile` and `apps/desktop` to verify that the
 * `@cachink/ui` → Tamagui → React Native / React DOM rendering pipeline works
 * end-to-end. This is NOT one of the 11 Phase 1A primitives (see CLAUDE.md
 * §8.4). When Phase 1A lands, Btn / Card / Tag etc. replace this as the
 * canonical "look at our brand on screen" surface.
 *
 * The component is intentionally minimal:
 *   - One yellow card with hard black border + hard drop shadow (the brand DNA).
 *   - One line of uppercase heading text.
 *   - One line of body text.
 *
 * All visual values come from `packages/ui/src/theme.ts` — no inline hex codes,
 * no invented radii, no soft shadows.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, radii, shadows, typography } from '../../theme';

export interface HelloBadgeProps {
  /** Text shown in the small uppercase label row. Defaults to "CACHINK!". */
  readonly label?: string;
  /** Text shown in the large body row. Defaults to "Hola, emprendedor.". */
  readonly greeting?: string;
}

const CARD_RADIUS = radii[4]; // 16 — see CLAUDE.md §8.3 scale.

function LabelText({ children }: { children: string }): ReactElement {
  return (
    <Text
      testID="hello-badge-label"
      color={colors.black}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.bold}
      fontSize={12}
      letterSpacing={typography.letterSpacing.wide}
      // textTransform is a web/RN-compatible style; Tamagui passes it through.
      style={{ textTransform: 'uppercase' }}
    >
      {children}
    </Text>
  );
}

function GreetingText({ children }: { children: string }): ReactElement {
  return (
    <Text
      testID="hello-badge-greeting"
      color={colors.ink}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.black}
      fontSize={24}
      letterSpacing={typography.letterSpacing.tight}
      marginTop={6}
    >
      {children}
    </Text>
  );
}

/**
 * Renders a yellow neobrutalist card that exercises every token category:
 * colors (brand yellow + ink), typography (uppercase label + bold heading),
 * border (2px solid black), shadow (4px 4px hard), radius (16).
 */
export function HelloBadge(props: HelloBadgeProps): ReactElement {
  const label = props.label ?? 'CACHINK!';
  const greeting = props.greeting ?? 'Hola, emprendedor.';
  return (
    <View
      testID="hello-badge"
      backgroundColor={colors.yellow}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={CARD_RADIUS}
      padding={20}
      shadowColor={colors.black}
      shadowOffset={{ width: 4, height: 4 }}
      shadowOpacity={1}
      shadowRadius={0}
      style={{ boxShadow: shadows.card }}
    >
      <LabelText>{label}</LabelText>
      <GreetingText>{greeting}</GreetingText>
    </View>
  );
}

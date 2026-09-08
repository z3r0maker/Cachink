/**
 * HelpAccordion — inline contextual help for financial terms.
 *
 * Always shows a 1-line plain-Spanish subtitle. A (?) icon toggles an
 * expandable 2-3 sentence explanation with a concrete example.
 *
 * The (?) icon changes to (×) when expanded. The expanded section has a
 * subtle `blueSoft` background tint.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, fontSizes, radii, typography } from '../../theme';
import { Icon } from '../Icon/index';

export interface HelpAccordionProps {
  /** Always-visible 1-line plain-Spanish subtitle. */
  readonly subtitle: string;
  /** Expandable 2-3 sentence explanation with concrete example. */
  readonly detail: string;
  readonly defaultOpen?: boolean;
  readonly testID?: string;
}

function AccordionHeader({
  subtitle,
  expanded,
  onToggle,
}: {
  subtitle: string;
  expanded: boolean;
  onToggle: () => void;
}): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={6}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={fontSizes.xs}
        color={colors.gray600}
        flex={1}
      >
        {subtitle}
      </Text>
      <View
        testID="help-accordion-trigger"
        role="button"
        aria-expanded={expanded}
        onPress={onToggle}
        hitSlop={8}
        cursor="pointer"
        padding={2}
      >
        <Icon
          name={expanded ? 'x' : 'circle-help'}
          size={16}
          color={expanded ? colors.gray600 : colors.blue}
        />
      </View>
    </View>
  );
}

function AccordionDetail({ detail }: { detail: string }): ReactElement {
  return (
    <View
      testID="help-accordion-detail"
      role="region"
      backgroundColor={colors.blueSoft}
      paddingHorizontal={10}
      paddingVertical={8}
      borderRadius={radii[2]}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.regular}
        fontSize={fontSizes.xs}
        color={colors.ink}
        lineHeight={18}
      >
        {detail}
      </Text>
    </View>
  );
}

export function HelpAccordion(props: HelpAccordionProps): ReactElement {
  const [expanded, setExpanded] = useState(props.defaultOpen ?? false);
  const toggle = (): void => setExpanded((prev) => !prev);

  return (
    <View testID={props.testID ?? 'help-accordion'} gap={4}>
      <AccordionHeader subtitle={props.subtitle} expanded={expanded} onToggle={toggle} />
      {expanded && <AccordionDetail detail={props.detail} />}
    </View>
  );
}

/**
 * OptionCardGroup — tappable icon+description card selector for ≤5
 * mutually-exclusive choices.
 *
 * Per CLAUDE.md §6: "When a form presents ≤5 mutually-exclusive choices,
 * use icon+description cards instead of a Combobox dropdown."
 *
 * Each card shows: icon (24 px) · bold label · 1-line muted description.
 * Selected card gets `yellowSoft` background; unselected is white.
 * Neobrutalist border (2 px solid black, borderRadius 12).
 *
 * Uses `<Pressable>` from react-native (not `<View onPress>`) per
 * project convention.
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import { colors, radii, typography } from '../../theme';
import { Icon, type IconName } from '../Icon/index';

export interface OptionCardItem<K extends string = string> {
  readonly key: K;
  readonly icon: IconName;
  readonly label: string;
  readonly description: string;
}

export interface OptionCardGroupProps<K extends string = string> {
  readonly value: K;
  readonly onChange: (key: K) => void;
  readonly options: readonly OptionCardItem<K>[];
  /** Optional uppercase form label above the card group. */
  readonly label?: string;
  /** Forwarded to root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

const CARD_RADIUS = radii[2]; // 12
const BORDER_SELECTED = 2.5;
const BORDER_UNSELECTED = 2;

function OptionCard<K extends string>({
  item,
  selected,
  onPress,
}: {
  item: OptionCardItem<K>;
  selected: boolean;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      onPress={onPress}
      testID={`option-card-${item.key}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View
        flexDirection="row"
        alignItems="center"
        gap={12}
        padding={14}
        borderWidth={selected ? BORDER_SELECTED : BORDER_UNSELECTED}
        borderColor={colors.black}
        borderRadius={CARD_RADIUS}
        backgroundColor={selected ? colors.yellowSoft : colors.white}
      >
        <Icon name={item.icon} size={24} color={colors.black} />
        <View flex={1} gap={2}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={14}
            color={colors.black}
            numberOfLines={1}
          >
            {item.label}
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.regular}
            fontSize={12}
            color={colors.gray400}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function OptionCardGroup<K extends string>(
  props: OptionCardGroupProps<K>,
): ReactElement {
  return (
    <View gap={8} testID={props.testID ?? 'option-card-group'}>
      {props.label !== undefined && (
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.semibold}
          fontSize={12}
          color={colors.gray600}
          textTransform="uppercase"
          letterSpacing={typography.letterSpacing.wide}
          testID="option-card-group-label"
        >
          {props.label}
        </Text>
      )}
      {props.options.map((item) => (
        <OptionCard
          key={item.key}
          item={item}
          selected={item.key === props.value}
          onPress={() => {
            if (item.key !== props.value) {
              props.onChange(item.key);
            }
          }}
        />
      ))}
    </View>
  );
}

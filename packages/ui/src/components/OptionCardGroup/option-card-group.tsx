/**
 * OptionCardGroup — tappable icon+description card selector for ≤5
 * mutually-exclusive choices.
 *
 * Per CLAUDE.md §6: "When a form presents ≤5 mutually-exclusive choices,
 * use icon+description cards instead of a Combobox dropdown."
 *
 * **list** (default) — vertical stack, icon · label · description.
 * **grid** — 2-column compact squares, icon centered above bold label.
 *
 * Selected card gets `yellowSoft` background; unselected is white.
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import { colors, radii, typography } from '../../theme';
import { impactLight } from '../../haptics/index';
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
  /** Card arrangement. `list` = vertical stack (default), `grid` = 2-column squares. */
  readonly layout?: 'list' | 'grid';
  /** Forwarded to root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

const R = radii[2]; // 12
const BS = 2.5;
const BU = 2;

function ListCard<K extends string>(p: {
  item: OptionCardItem<K>;
  selected: boolean;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable onPress={p.onPress} testID={`option-card-${p.item.key}`}
      accessibilityRole="radio" accessibilityState={{ selected: p.selected }}>
      <View flexDirection="row" alignItems="center" gap={12} padding={14}
        borderWidth={p.selected ? BS : BU} borderColor={colors.black}
        borderRadius={R} backgroundColor={p.selected ? colors.yellowSoft : colors.white}>
        <Icon name={p.item.icon} size={24} color={colors.black} />
        <View flex={1} gap={2}>
          <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold}
            fontSize={14} color={colors.black} numberOfLines={1}>
            {p.item.label}
          </Text>
          <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.regular}
            fontSize={12} color={colors.gray400} numberOfLines={1}>
            {p.item.description}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function GridCard<K extends string>(p: {
  item: OptionCardItem<K>;
  selected: boolean;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable onPress={p.onPress} testID={`option-card-${p.item.key}`}
      accessibilityRole="radio" accessibilityState={{ selected: p.selected }}
      style={{ width: '48%' }}>
      <View flexDirection="row" alignItems="center" gap={8}
        paddingVertical={12} paddingHorizontal={12}
        borderWidth={p.selected ? BS : BU} borderColor={colors.black}
        borderRadius={R} backgroundColor={p.selected ? colors.yellowSoft : colors.white}>
        <Icon name={p.item.icon} size={20} color={colors.black} />
        <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold}
          fontSize={13} color={colors.black} numberOfLines={1}>
          {p.item.label}
        </Text>
      </View>
    </Pressable>
  );
}

function tap<K extends string>(
  item: OptionCardItem<K>, value: K, onChange: (k: K) => void,
): void {
  if (item.key !== value) { impactLight(); onChange(item.key); }
}

export function OptionCardGroup<K extends string>(
  props: OptionCardGroupProps<K>,
): ReactElement {
  const isGrid = props.layout === 'grid';
  const Card = isGrid ? GridCard : ListCard;

  return (
    <View gap={8} testID={props.testID ?? 'option-card-group'}>
      {props.label !== undefined && (
        <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.semibold}
          fontSize={12} color={colors.gray600} textTransform="uppercase"
          letterSpacing={typography.letterSpacing.wide} testID="option-card-group-label">
          {props.label}
        </Text>
      )}
      {isGrid ? (
        <View flexDirection="row" flexWrap="wrap" gap={8}>
          {props.options.map((item) => (
            <Card key={item.key} item={item} selected={item.key === props.value}
              onPress={() => tap(item, props.value, props.onChange)} />
          ))}
        </View>
      ) : (
        props.options.map((item) => (
          <Card key={item.key} item={item} selected={item.key === props.value}
            onPress={() => tap(item, props.value, props.onChange)} />
        ))
      )}
    </View>
  );
}

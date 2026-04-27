/**
 * Internal — single tab item rendered by `<BottomTabBar>`. Not exported
 * from the BottomTabBar barrel; consumers compose tabs via the
 * `BottomTabBarItem` items array on the parent.
 *
 * Per ADR-040 the active state is a 4-px yellow strip pinned to the
 * top of the cell (mocks 1/2/4) instead of a full-cell yellow fill.
 * Inactive icons + labels render at 0.55 opacity so the active cell
 * pops without needing icon recoloring at the BottomTabBar level —
 * consumers can pass any ReactNode and the visual hierarchy still reads.
 */
import type { ReactElement, ReactNode } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, typography } from '../../theme';

export interface TabItemProps {
  readonly label: string;
  readonly icon?: ReactNode;
  readonly active: boolean;
  readonly onPress: () => void;
  readonly badge?: number;
  readonly testID?: string;
}

const PRESS_STYLE = { opacity: 0.7 };

const INACTIVE_OPACITY = 0.55;

function ActiveStrip(): ReactElement {
  return (
    <View
      testID="tab-item-active-strip"
      position="absolute"
      top={0}
      left="20%"
      right="20%"
      height={4}
      backgroundColor={colors.yellow}
      borderBottomLeftRadius={4}
      borderBottomRightRadius={4}
    />
  );
}

function Badge({ count }: { count: number }): ReactElement {
  return (
    <View
      testID="tab-item-badge"
      backgroundColor={colors.red}
      borderRadius={9}
      width={18}
      height={18}
      alignItems="center"
      justifyContent="center"
      position="absolute"
      top={6}
      right={12}
    >
      <Text
        color={colors.white}
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={10}
      >
        {count}
      </Text>
    </View>
  );
}

function Label({ text, active }: { text: string; active: boolean }): ReactElement {
  return (
    <Text
      testID="tab-item-label"
      color={active ? colors.black : colors.gray600}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.bold}
      fontSize={11}
      letterSpacing={typography.letterSpacing.wide}
      style={{ textTransform: 'uppercase' }}
    >
      {text}
    </Text>
  );
}

/**
 * Renders one tab cell. Active = yellow top-strip + full-opacity icon
 * + bold black label. Inactive = transparent + 0.55 opacity + gray
 * label.
 */
export function TabItem(props: TabItemProps): ReactElement {
  return (
    <View
      testID={props.testID}
      onPress={props.onPress}
      pressStyle={PRESS_STYLE}
      flex={1}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      backgroundColor="transparent"
      cursor="pointer"
      role="tab"
      aria-label={props.label}
      aria-selected={props.active}
      style={{ userSelect: 'none', position: 'relative' }}
    >
      {props.active && <ActiveStrip />}
      {props.icon !== undefined && (
        <View testID="tab-item-icon" marginBottom={4} opacity={props.active ? 1 : INACTIVE_OPACITY}>
          {/**
           * Wrap string icons in `<Text>` — Tamagui's `<View>` rejects
           * direct text-node children on both platforms. Consumers
           * normally pass an `<Icon>` element which renders unwrapped.
           */}
          {typeof props.icon === 'string' ? <Text fontSize={22}>{props.icon}</Text> : props.icon}
        </View>
      )}
      <Label text={props.label} active={props.active} />
      {props.badge !== undefined && <Badge count={props.badge} />}
    </View>
  );
}

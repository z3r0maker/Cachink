/**
 * Internal — single tab item rendered by `<BottomTabBar>`. Not exported
 * from the BottomTabBar barrel; consumers compose tabs via the
 * `BottomTabBarItem` items array on the parent.
 *
 * Extracted into its own file purely to keep `bottom-tab-bar.tsx` and the
 * tab-item rendering both well under the §4.4 file budgets.
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
 * Renders one tab cell. Yellow surface when active, transparent otherwise.
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
      backgroundColor={props.active ? colors.yellow : 'transparent'}
      cursor="pointer"
      style={{ userSelect: 'none' }}
    >
      {props.icon !== undefined && (
        <View testID="tab-item-icon" marginBottom={2}>
          {props.icon}
        </View>
      )}
      <Label text={props.label} active={props.active} />
      {props.badge !== undefined && <Badge count={props.badge} />}
    </View>
  );
}

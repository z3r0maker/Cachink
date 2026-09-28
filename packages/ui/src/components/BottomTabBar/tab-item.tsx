/**
 * Internal — single tab item rendered by `<BottomTabBar>`. Not exported
 * from the BottomTabBar barrel; consumers compose tabs via the
 * `BottomTabBarItem` items array on the parent.
 *
 * El Mostrador (the phone boards, MvTurno): the current tab is filled
 * yellow with a black edge on either side; the others are white with a
 * gray600 label. The label is 12 px, sentence case.
 *
 * The root is RN `<Pressable>`, not Tamagui `<View onPress>`: Tamagui's
 * handler does not fire on Maestro/iOS synthetic taps (same fix as Btn).
 */
import type { ReactElement, ReactNode } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { Text, View } from '@tamagui/core';
import {
  borderWidths,
  colors,
  fontSizes,
  portalFontSizes,
  shapeRadii,
  typography,
} from '../../theme';
import { impactLight } from '../../haptics/index';

export interface TabItemProps {
  readonly label: string;
  readonly icon?: ReactNode;
  readonly active: boolean;
  readonly onPress: () => void;
  readonly badge?: number;
  readonly testID?: string;
}

function Badge({ count }: { count: number }): ReactElement {
  return (
    <View
      testID="tab-item-badge"
      backgroundColor={colors.red}
      borderRadius={shapeRadii.pill}
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
        fontSize={fontSizes.xs}
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
      fontWeight={active ? typography.weights.extraBold : typography.weights.bold}
      fontSize={portalFontSizes.xs}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {text}
    </Text>
  );
}

const BASE_STYLE: ViewStyle = {
  flex: 1,
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  minHeight: 44,
  backgroundColor: colors.white,
  position: 'relative',
};

const ACTIVE_STYLE: ViewStyle = {
  ...BASE_STYLE,
  backgroundColor: colors.yellow,
  borderLeftWidth: borderWidths.thin,
  borderRightWidth: borderWidths.thin,
  borderColor: colors.black,
};

const PRESSED_STYLE: ViewStyle = { ...BASE_STYLE, backgroundColor: colors.yellowSoft };

function cellStyle(active: boolean, pressed: boolean): ViewStyle {
  if (active) return ACTIVE_STYLE;
  return pressed ? PRESSED_STYLE : BASE_STYLE;
}

/** Renders one tab cell: yellow with black sides when current, white otherwise. */
export function TabItem(props: TabItemProps): ReactElement {
  return (
    <Pressable
      testID={props.testID}
      onPress={
        props.active
          ? undefined
          : () => {
              impactLight();
              props.onPress();
            }
      }
      style={({ pressed }) => cellStyle(props.active, pressed)}
      role="tab"
      aria-label={props.label}
      aria-selected={props.active}
      accessibilityRole="tab"
      accessibilityLabel={props.label}
      accessibilityState={{ selected: props.active }}
    >
      {props.icon !== undefined && (
        <View testID="tab-item-icon">
          {/**
           * Wrap string icons in `<Text>` — Tamagui's `<View>` rejects
           * direct text-node children on both platforms. Consumers
           * normally pass an `<Icon>` element which renders unwrapped.
           */}
          {typeof props.icon === 'string' ? (
            <Text fontSize={fontSizes.xl2}>{props.icon}</Text>
          ) : (
            props.icon
          )}
        </View>
      )}
      <Label text={props.label} active={props.active} />
      {props.badge !== undefined && <Badge count={props.badge} />}
    </Pressable>
  );
}

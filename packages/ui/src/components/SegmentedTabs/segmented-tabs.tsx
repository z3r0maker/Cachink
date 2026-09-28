/**
 * SegmentedTabs — the joined tabs of Avisos and Inventario (the caja's
 * `operador/ui/tabs.tsx`, docs/design/el-mostrador.md §2): one white strip
 * with the thick black edge and the card shadow, the selected tab filled
 * yellow, an optional count pill in each.
 *
 * A `tablist` of `tab`s; each tab is at least 50 px tall and grows to share
 * the row. Unlike `SegmentedToggle` (separate chips, a radio group for a form
 * field) this switches what the screen below shows.
 */
import type { ReactElement } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';
import { impactLight } from '../../haptics/index';
import { MText } from '../Mostrador/mtext';

/** The web tabs' `letterSpacing.wide` (0.05em) at 13 px. */
const TRACKING = 0.65;

export interface SegmentedTab<K extends string> {
  readonly key: K;
  readonly label: string;
  /** Shown in a pill beside the label when present. */
  readonly count?: number;
}

export interface SegmentedTabsProps<K extends string> {
  readonly tabs: readonly SegmentedTab<K>[];
  readonly value: K;
  readonly onChange: (next: K) => void;
  /** What the tabs switch, for screen readers («Avisos por estado»). */
  readonly ariaLabel: string;
  readonly testID?: string;
}

function tabStyle(selected: boolean, first: boolean): ViewStyle {
  return {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderLeftWidth: first ? 0 : borderWidths.thin,
    borderLeftColor: colors.black,
    backgroundColor: selected ? colors.yellow : colors.white,
  };
}

function Count({ n, selected }: { n: number; selected: boolean }): ReactElement {
  return (
    <View
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      borderRadius={shapeRadii.pill}
      backgroundColor={selected ? colors.white : colors.gray100}
      paddingHorizontal={8}
      paddingVertical={1}
    >
      <MText size="xs">{n}</MText>
    </View>
  );
}

function TabCell<K extends string>(p: {
  readonly tab: SegmentedTab<K>;
  readonly selected: boolean;
  readonly first: boolean;
  readonly onChange: (next: K) => void;
  readonly testID: string;
}): ReactElement {
  const { tab, selected } = p;
  return (
    <Pressable
      testID={p.testID}
      role="tab"
      aria-selected={selected}
      aria-label={tab.count === undefined ? tab.label : `${tab.label}, ${tab.count}`}
      onPress={() => {
        if (selected) return;
        impactLight();
        p.onChange(tab.key);
      }}
      style={tabStyle(selected, p.first)}
    >
      <MText
        size="sm"
        weight="extraBold"
        letterSpacing={TRACKING}
        style={{ textTransform: 'uppercase' }}
      >
        {tab.label}
      </MText>
      {tab.count === undefined ? null : <Count n={tab.count} selected={selected} />}
    </Pressable>
  );
}

export function SegmentedTabs<K extends string>(props: SegmentedTabsProps<K>): ReactElement {
  const prefix = props.testID ?? 'segmented-tabs';
  return (
    <View
      testID={prefix}
      role="tablist"
      aria-label={props.ariaLabel}
      flexDirection="row"
      overflow="hidden"
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      borderRadius={radii[4]}
      backgroundColor={colors.white}
      style={{ boxShadow: shadows.card }}
    >
      {props.tabs.map((tab, i) => (
        <TabCell
          key={tab.key}
          tab={tab}
          selected={tab.key === props.value}
          first={i === 0}
          onChange={props.onChange}
          testID={`${prefix}-${tab.key}`}
        />
      ))}
    </View>
  );
}

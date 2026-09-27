/**
 * NavRows — the big rows Mi turno and Inicio open the rest of the caja from
 * (MvTurno «Lo de tu turno»): a quiet panel of 68 px rows, each a tinted
 * 44 px glyph tile with the black edge, a title and its detail, an optional
 * status chip and a chevron. Every row is one button.
 */
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { borderColors, borderWidths, colors, denseRadii, radii, shapeRadii } from '../../theme';
import { impactLight } from '../../haptics/index';
import { MText } from '../Mostrador/mtext';
import { GLYPHS } from '../PathIcon/glyphs';
import { PathIcon } from '../PathIcon/path-icon';

export type NavRowChipTone = 'red' | 'amber' | 'green' | 'yellow';

const CHIP: Record<NavRowChipTone, { bg: string; fg: string; edge: string }> = {
  red: { bg: colors.redSoft, fg: colors.redText, edge: colors.redText },
  amber: { bg: colors.warningSoft, fg: colors.warningText, edge: colors.warningText },
  green: { bg: colors.greenSoft, fg: colors.greenText, edge: colors.greenText },
  yellow: { bg: colors.yellow, fg: colors.black, edge: colors.black },
};

export interface NavRowItem {
  readonly key: string;
  readonly title: string;
  readonly detail?: string;
  /** A path in a 24 × 24 box (`ICONS.gastos`, `GLYPHS.ajustes`…). */
  readonly icon: string;
  /** The glyph tile's ground: a `*Soft` colour. */
  readonly tint: string;
  readonly chip?: { readonly label: string; readonly tone: NavRowChipTone };
  readonly onPress: () => void;
  readonly testID?: string;
}

function RowChip({ label, tone }: { label: string; tone: NavRowChipTone }): ReactElement {
  const c = CHIP[tone];
  return (
    <View
      height={24}
      paddingHorizontal={9}
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={c.edge}
      backgroundColor={c.bg}
    >
      <MText size="xs" weight="extraBold" color={c.fg}>
        {label}
      </MText>
    </View>
  );
}

function rowStyle(pressed: boolean, last: boolean): ViewStyle {
  return {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: pressed ? colors.yellowSoft : colors.white,
    borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray100,
  };
}

function RowBody({ item }: { item: NavRowItem }): ReactElement {
  return (
    <>
      <View
        width={44}
        height={44}
        alignItems="center"
        justifyContent="center"
        borderRadius={denseRadii.r13}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={item.tint}
      >
        <PathIcon d={item.icon} size={20} />
      </View>
      <View flex={1} minWidth={0} gap={2} alignItems="flex-start">
        <MText size="lg" weight="extraBold">
          {item.title}
        </MText>
        {item.detail ? (
          <MText size="sm" weight="semibold" color={colors.gray600} numberOfLines={1}>
            {item.detail}
          </MText>
        ) : null}
      </View>
      {item.chip ? <RowChip {...item.chip} /> : null}
      <PathIcon d={GLYPHS.chevronRight} size={18} strokeWidth={2.4} color={colors.textMuted} />
    </>
  );
}

function Row({ item, last }: { item: NavRowItem; last: boolean }): ReactElement {
  const label = item.detail ? `${item.title}. ${item.detail}` : item.title;
  return (
    <Pressable
      testID={item.testID ?? `nav-row-${item.key}`}
      role="button"
      aria-label={item.chip ? `${label}. ${item.chip.label}` : label}
      onPress={() => {
        impactLight();
        item.onPress();
      }}
      style={({ pressed }) => rowStyle(pressed, last)}
    >
      <RowBody item={item} />
    </Pressable>
  );
}

export function NavRows(props: {
  readonly items: readonly NavRowItem[];
  /** What the rows are, for screen readers («Lo de tu turno»). */
  readonly label: string;
  readonly testID?: string;
}): ReactElement {
  return (
    <View
      testID={props.testID ?? 'nav-rows'}
      role="navigation"
      aria-label={props.label}
      backgroundColor={colors.white}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      borderRadius={radii[6]}
      overflow="hidden"
    >
      {props.items.map((item, i) => (
        <Row key={item.key} item={item} last={i === props.items.length - 1} />
      ))}
    </View>
  );
}

/**
 * IconPickerScreen — full-screen icon selection grouped by category.
 *
 * Branded neobrutalist layout: yellow accent strip, category sections
 * with bold headers, 4-5 column grid of tappable icon cards.
 */

import { useState, type ReactElement } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { ProductIcon } from '@cachink/domain';
import { Btn, Icon } from '../../components/index';
import type { IconName } from '../../components/Icon/icon.shared';
import { colors, typography } from '../../theme';
import { ICON_CATEGORIES, type IconCategory } from './icon-picker-data';

export interface IconPickerScreenProps {
  readonly selectedIcon: ProductIcon | null;
  readonly onAccept: (icon: ProductIcon) => void;
  readonly onCancel: () => void;
  readonly testID?: string;
}

function CategoryHeader({ label }: { label: string }): ReactElement {
  return (
    <View
      backgroundColor={colors.yellowSoft}
      paddingHorizontal={16}
      paddingVertical={8}
      borderRadius={10}
      marginBottom={8}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={14}
        color={colors.black}
        letterSpacing={typography.letterSpacing.wide}
        textTransform="uppercase"
      >
        {label}
      </Text>
    </View>
  );
}

function TileContent(props: { icon: ProductIcon; selected: boolean }): ReactElement {
  const bg = props.selected ? colors.yellow : colors.white;
  const borderW = props.selected ? 2.5 : 2;
  return (
    <View
      backgroundColor={bg}
      borderWidth={borderW}
      borderColor={colors.black}
      borderRadius={12}
      padding={10}
      alignItems="center"
      justifyContent="center"
      gap={4}
      minWidth={64}
      minHeight={64}
      {...(props.selected && { scale: 1.05 })}
    >
      <Icon name={props.icon as IconName} size={32} color={colors.black} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={9}
        color={colors.gray600}
        numberOfLines={1}
        textAlign="center"
      >
        {props.icon}
      </Text>
    </View>
  );
}

function IconTile(props: {
  icon: ProductIcon;
  selected: boolean;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable onPress={props.onPress} testID={`icon-tile-${props.icon}`}>
      <TileContent icon={props.icon} selected={props.selected} />
    </Pressable>
  );
}

function CategorySection(props: {
  category: IconCategory;
  selected: ProductIcon | null;
  onSelect: (icon: ProductIcon) => void;
}): ReactElement {
  return (
    <View marginBottom={16}>
      <CategoryHeader label={props.category.label} />
      <View flexDirection="row" flexWrap="wrap" gap={10}>
        {props.category.icons.map((icon) => (
          <IconTile
            key={icon}
            icon={icon}
            selected={props.selected === icon}
            onPress={() => props.onSelect(icon)}
          />
        ))}
      </View>
    </View>
  );
}

function PickerTopBar(props: { onCancel: () => void }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal={16}
      paddingVertical={12}
    >
      <Pressable onPress={props.onCancel} testID="icon-picker-cancel">
        <Icon name="chevron-left" size={24} color={colors.black} />
      </Pressable>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={18}
        color={colors.black}
      >
        Seleccionar ícono
      </Text>
      <View width={24} />
    </View>
  );
}

function PickerFooter(props: {
  selected: ProductIcon | null;
  onAccept: (icon: ProductIcon) => void;
}): ReactElement {
  return (
    <View
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      padding={16}
      paddingBottom={32}
      backgroundColor={colors.offwhite}
      borderTopWidth={2}
      borderTopColor={colors.gray200}
    >
      <Btn
        variant="primary"
        onPress={() => { if (props.selected) props.onAccept(props.selected); }}
        disabled={props.selected === null}
        fullWidth
        testID="icon-picker-accept"
      >
        Aceptar
      </Btn>
    </View>
  );
}

export function IconPickerScreen(props: IconPickerScreenProps): ReactElement {
  const [selected, setSelected] = useState<ProductIcon | null>(props.selectedIcon);

  return (
    <View testID={props.testID ?? 'icon-picker-screen'} flex={1} backgroundColor={colors.offwhite}>
      <View backgroundColor={colors.yellow} height={6} />
      <PickerTopBar onCancel={props.onCancel} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {ICON_CATEGORIES.map((cat) => (
          <CategorySection
            key={cat.key}
            category={cat}
            selected={selected}
            onSelect={setSelected}
          />
        ))}
      </ScrollView>
      <PickerFooter selected={selected} onAccept={props.onAccept} />
    </View>
  );
}

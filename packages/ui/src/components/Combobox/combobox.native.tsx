/**
 * Combobox — React Native bottom-sheet variant (Audit M-1 PR 5).
 *
 * On mobile, Tamagui's Popover either overflows the screen or clips
 * on small phones. This variant renders options inside a bottom-sheet
 * `<Modal>` that slides up from the screen edge — the standard
 * pattern for mobile pickers.
 *
 * Metro auto-picks this file on iOS/Android via `.native.tsx`
 * resolution. Desktop/web continues to use `./combobox.tsx`
 * (Popover-anchored picker).
 */
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { FlatList, Modal, Pressable, TextInput, type ListRenderItemInfo } from 'react-native';
import { Text, View } from '@tamagui/core';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../Icon/index';
import { colors, fontSizes, typography } from '../../theme';
import type { ComboboxOption, ComboboxProps } from './combobox-types';
import { TriggerView } from './combobox-views';
import { styles } from './combobox-styles.native';
import { ComboboxField } from './combobox-field';

export type { ComboboxOption, ComboboxProps };

function OptionRowNative<T extends string>({
  option,
  selected,
  onSelect,
}: {
  option: ComboboxOption<T>;
  selected: boolean;
  onSelect: () => void;
}): ReactElement {
  return (
    <Pressable
      testID={`combobox-option-${option.key}`}
      onPress={onSelect}
      style={selected ? styles.selectedRow : styles.optionRow}
    >
      <View flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={selected ? typography.weights.bold : typography.weights.medium}
          fontSize={fontSizes.lg}
          color={colors.ink}
        >
          {option.label}
        </Text>
        {selected && <Icon name="check" size={18} color={colors.black} />}
      </View>
    </Pressable>
  );
}

function EmptyResults(): ReactElement {
  return (
    <View paddingHorizontal={14} paddingVertical={12}>
      <Text fontFamily={typography.fontFamily} fontSize={fontSizes.md} color={colors.textMuted}>
        Sin resultados
      </Text>
    </View>
  );
}

/** Computes display-only derived values (no open/query state). */
function useComboboxDisplay<T extends string>(props: ComboboxProps<T>) {
  const insets = useSafeAreaInsets();
  const disabled = props.disabled === true;
  const searchable = props.searchable === true;
  const selected = props.options.find((o) => o.key === props.value);
  const placeholder = props.placeholder ?? 'Seleccionar...';
  const triggerLabel = selected?.label ?? (props.value !== '' ? String(props.value) : placeholder);
  const isPlaceholder = selected === undefined && (props.value === '' || props.value === undefined);
  return { insets, disabled, searchable, triggerLabel, isPlaceholder };
}

/** Manages open/query state + interactive handlers. */
function useComboboxHandlers<T extends string>(props: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const visibleOptions = useMemo(() => {
    if (!props.searchable || query === '') return props.options;
    const needle = query.trim().toLowerCase();
    return props.options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [props.options, props.searchable, query]);
  const handleSelect = useCallback(
    (key: T) => {
      props.onChange(key);
      setOpen(false);
      setQuery('');
    },
    [props.onChange],
  );
  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ComboboxOption<T>>) => (
      <OptionRowNative
        option={item}
        selected={item.key === props.value}
        onSelect={() => handleSelect(item.key)}
      />
    ),
    [props.value, handleSelect],
  );
  return { open, setOpen, query, setQuery, visibleOptions, handleClose, renderItem };
}

/** The bottom sheet with the (optionally searchable) option list. */
function ComboboxSheet<T extends string>(props: {
  readonly h: ReturnType<typeof useComboboxHandlers<T>>;
  readonly searchable: boolean;
  readonly bottomInset: number;
}): ReactElement {
  return (
    <Modal
      visible={props.h.open}
      animationType="slide"
      transparent
      onRequestClose={props.h.handleClose}
    >
      <Pressable style={styles.backdrop} onPress={props.h.handleClose} />
      <View style={[styles.sheet, { paddingBottom: props.bottomInset + 16 }] as never}>
        <View style={styles.handle} />
        {props.searchable && (
          <TextInput
            testID="combobox-search"
            value={props.h.query}
            onChangeText={props.h.setQuery}
            placeholder="Buscar..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoFocus
          />
        )}
        <FlatList
          data={props.h.visibleOptions as ComboboxOption<T>[]}
          keyExtractor={(item) => item.key}
          renderItem={props.h.renderItem}
          ListEmptyComponent={<EmptyResults />}
        />
      </View>
    </Modal>
  );
}

/**
 * Renders a brand-styled bottom-sheet picker for mobile. Same public
 * API as the desktop `Combobox` — consumers don't know which variant
 * they're rendering.
 */
export function Combobox<T extends string = string>(props: ComboboxProps<T>): ReactElement {
  const h = useComboboxHandlers(props);
  const d = useComboboxDisplay(props);
  return (
    <>
      <ComboboxField label={props.label} note={props.note}>
        <TriggerView
          testID={props.testID ?? 'combobox-trigger'}
          ariaLabel={props.ariaLabel ?? props.label}
          open={h.open}
          disabled={d.disabled}
          displayText={d.triggerLabel}
          isPlaceholder={d.isPlaceholder}
          onPress={() => !d.disabled && h.setOpen(true)}
        />
      </ComboboxField>
      <ComboboxSheet<T> h={h} searchable={d.searchable} bottomInset={d.insets.bottom} />
    </>
  );
}

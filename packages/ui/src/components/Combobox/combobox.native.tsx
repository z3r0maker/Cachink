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
import {
  FlatList,
  Modal,
  Pressable,
  TextInput,
  type ListRenderItemInfo,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Text, View } from '@tamagui/core';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../Icon/index';
import { colors, radii, typography } from '../../theme';
import type { ComboboxOption, ComboboxProps } from './combobox-types';
import { TriggerView } from './combobox-views';

export type { ComboboxOption, ComboboxProps };

const TRIGGER_RADIUS = radii[2];

const styles = {
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  } satisfies ViewStyle,
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderColor: colors.black,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    maxHeight: '60%',
    paddingHorizontal: 16,
    paddingTop: 12,
  } satisfies ViewStyle,
  searchInput: {
    borderColor: colors.black,
    borderWidth: 2,
    borderRadius: TRIGGER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: typography.fontFamily,
    color: colors.ink,
    marginBottom: 8,
  } satisfies TextStyle,
  optionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii[1],
  } satisfies ViewStyle,
  selectedRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii[1],
    backgroundColor: colors.gray100,
  } satisfies ViewStyle,
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray400,
    alignSelf: 'center',
    marginBottom: 8,
  } as ViewStyle,
} as const;

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
          fontSize={16}
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
      <Text fontFamily={typography.fontFamily} fontSize={14} color={colors.gray400}>
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
      <TriggerView
        testID={props.testID ?? 'combobox-trigger'}
        ariaLabel={props.ariaLabel ?? props.label}
        open={h.open}
        disabled={d.disabled}
        displayText={d.triggerLabel}
        isPlaceholder={d.isPlaceholder}
        onPress={() => !d.disabled && h.setOpen(true)}
      />
      <Modal visible={h.open} animationType="slide" transparent onRequestClose={h.handleClose}>
        <Pressable style={styles.backdrop} onPress={h.handleClose} />
        <View style={[styles.sheet, { paddingBottom: d.insets.bottom + 16 }] as never}>
          <View style={styles.handle} />
          {d.searchable && (
            <TextInput
              testID="combobox-search"
              value={h.query}
              onChangeText={h.setQuery}
              placeholder="Buscar..."
              placeholderTextColor={colors.gray400}
              style={styles.searchInput}
              autoFocus
            />
          )}
          <FlatList
            data={h.visibleOptions as ComboboxOption<T>[]}
            keyExtractor={(item) => item.key}
            renderItem={h.renderItem}
            ListEmptyComponent={<EmptyResults />}
          />
        </View>
      </Modal>
    </>
  );
}

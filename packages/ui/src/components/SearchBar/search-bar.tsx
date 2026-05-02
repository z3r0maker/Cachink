/**
 * `<SearchBar>` — labelled search input with a leading search icon.
 *
 * Closes audit finding 6.3: 2+ list screens reimplement the same
 * "Buscar" label + placeholder pattern via inline `<Input>`. The
 * primitive consolidates the shape and adds a leading `<Icon
 * name="search">` glyph so the affordance is visually unambiguous
 * (the previous label-only Input read as "edit field", not "search
 * field").
 *
 * Built on `<Input>` so it inherits the brand-faithful keyboard +
 * autofill plumbing from PR 2 — `autoCapitalize="none"`,
 * `returnKeyType="search"` are wired via the underlying field
 * primitive's `text` variant.
 *
 * The leading icon sits absolute-positioned over the input's left
 * edge with extra left-padding on the input itself so the user's text
 * never overlaps. The trailing-icon clear button is intentionally
 * omitted in this slice — RN's input-attached clear button doesn't
 * exist on web, and a custom one is a separate ergonomic decision.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Icon } from '../Icon/index';
import { Input } from '../Input/index';
import { colors } from '../../theme';

export interface SearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly placeholder?: string;
  /** Forwarded to the wrapping View for E2E test anchoring. */
  readonly testID?: string;
  /** Screen-reader label. Defaults to `label`. */
  readonly ariaLabel?: string;
  /** Fires on Return / Enter — useful when the search is async. */
  readonly onSubmit?: () => void;
}

const ICON_LEFT = 14;
const ICON_SIZE = 16;
const ICON_GAP = 8;
/** Input text must start after the icon: left offset + icon width + gap. */
const INPUT_PADDING_LEFT = ICON_LEFT + ICON_SIZE + ICON_GAP; // 38
const ICON_TOP_WITH_LABEL = 28;
const ICON_TOP_NO_LABEL = 13;

export function SearchBar(props: SearchBarProps): ReactElement {
  return (
    <View testID={props.testID ?? 'search-bar'} position="relative">
      <Input
        type="text"
        value={props.value}
        onChange={props.onChange}
        label={props.label}
        placeholder={props.placeholder}
        ariaLabel={props.ariaLabel ?? props.label}
        returnKeyType="search"
        onSubmitEditing={props.onSubmit}
        paddingLeft={INPUT_PADDING_LEFT}
      />
      {/*
       * Anchored search icon. The 28-pt top offset lines the icon up
       * against the field's vertical centre when a label is present;
       * 13-pt offset when there's no label.
       */}
      <View
        position="absolute"
        left={ICON_LEFT}
        top={props.label !== undefined ? ICON_TOP_WITH_LABEL : ICON_TOP_NO_LABEL}
        pointerEvents="none"
      >
        <Icon name="search" size={16} color={colors.gray600} />
      </View>
    </View>
  );
}

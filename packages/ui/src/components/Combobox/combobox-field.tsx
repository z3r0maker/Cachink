/**
 * ComboboxField — the form-row frame both Combobox variants render around
 * their trigger: the uppercase `label` above and the muted `note` below,
 * same tokens as `Input` so a picker lines up with the text fields next to it.
 */
import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import { InputLabel, InputNote } from '../Input/input-shared';

export interface ComboboxFieldProps {
  readonly label?: string;
  readonly note?: string;
  readonly children: ReactNode;
}

export function ComboboxField(props: ComboboxFieldProps): ReactElement {
  return (
    <View>
      {props.label !== undefined && props.label !== '' && <InputLabel text={props.label} />}
      {props.children}
      {props.note !== undefined && props.note !== '' && <InputNote text={props.note} />}
    </View>
  );
}

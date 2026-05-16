/**
 * SectionHeader — lightweight heading for form sections.
 */

import type { ReactElement } from 'react';
import { Text } from '@tamagui/core';

export interface SectionHeaderProps {
  readonly label: string;
  readonly testID?: string;
}

export function SectionHeader(props: SectionHeaderProps): ReactElement {
  return (
    <Text
      fontWeight="800"
      fontSize={22}
      color="$color"
      marginBottom={4}
      testID={props.testID}
    >
      {props.label}
    </Text>
  );
}

/**
 * SectionHeader — lightweight heading for form sections.
 */

import type { ReactElement } from 'react';
import { Text } from '@tamagui/core';
import { colors, fontSizes } from '../../theme';

export interface SectionHeaderProps {
  readonly label: string;
  readonly testID?: string;
}

export function SectionHeader(props: SectionHeaderProps): ReactElement {
  return (
    <Text
      fontWeight="800"
      fontSize={fontSizes.xl2}
      color={colors.black}
      marginBottom={4}
      testID={props.testID}
    >
      {props.label}
    </Text>
  );
}

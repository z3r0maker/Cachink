/**
 * The viewfinder drawn over the camera (MvEscaner): a yellow frame where the
 * code goes and the line across it. Decorative; the sheet says the words.
 */
import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '@tamagui/core';
import { borderWidths, colors, radii } from '../../theme';

export function EscanerVisor(): ReactElement {
  return (
    <View
      style={StyleSheet.absoluteFill}
      alignItems="center"
      justifyContent="center"
      pointerEvents="none"
      aria-hidden
    >
      <View
        width="72%"
        height={130}
        justifyContent="center"
        borderRadius={radii[3]}
        borderWidth={borderWidths.thick}
        borderColor={colors.yellow}
      >
        <View height={2} marginHorizontal={12} backgroundColor={colors.red} />
      </View>
    </View>
  );
}

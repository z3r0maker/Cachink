/**
 * Phase 0 placeholder screen — proves the cross-platform pipeline.
 *
 * Renders `<HelloBadge />` imported from `@cachink/ui`, the exact same
 * component the desktop app renders. If this screen looks identical on
 * mobile and desktop, ROADMAP P0-M6-T05 is satisfied.
 *
 * Phase 1A replaces this with the role picker (CLAUDE.md §1).
 */

import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { HelloBadge } from '@cachink/ui';
import { colors } from '@cachink/ui/theme';

export default function PlaceholderScreen(): ReactElement {
  return (
    <View style={styles.root}>
      <HelloBadge />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.offwhite,
    padding: 24,
  },
});

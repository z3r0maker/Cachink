/**
 * Phase 0 placeholder screen — proves the cross-platform pipeline.
 *
 * Renders `<HelloBadge />` imported from `@cachink/ui`, the exact same
 * component the mobile app renders. If this screen looks identical on
 * mobile and desktop, ROADMAP P0-M6-T05 is satisfied.
 *
 * Phase 1A replaces this with the role picker (CLAUDE.md §1).
 */

import type { ReactElement } from 'react';
import { HelloBadge } from '@cachink/ui';
import { colors } from '@cachink/ui/theme';

export function PlaceholderScreen(): ReactElement {
  return (
    <main
      style={{
        display: 'flex',
        flex: 1,
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: colors.offwhite,
      }}
    >
      <HelloBadge />
    </main>
  );
}

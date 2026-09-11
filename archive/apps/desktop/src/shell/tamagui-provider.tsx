/**
 * Shell-level Tamagui provider for `apps/desktop`.
 *
 * Wraps the Tauri webview app in `TamaguiProvider` using the shared minimal
 * config from `@cachink/ui`. All components from `@cachink/ui` depend on
 * this provider being present somewhere in the tree.
 *
 * Belongs in `shell/` per CLAUDE.md §5.6 — this is platform bootstrap, not
 * a reusable component.
 */

import type { ReactElement, ReactNode } from 'react';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '@cachink/ui';

export function AppTamaguiProvider({ children }: { children: ReactNode }): ReactElement {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      {children}
    </TamaguiProvider>
  );
}

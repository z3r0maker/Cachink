/**
 * Test helpers for `@cachink/ui`.
 *
 * Wraps `@testing-library/react`'s `render` with Tamagui's provider so
 * component tests don't have to import and mount the provider themselves.
 * Phase 1A may additionally wire a ThemeProvider and i18n provider here.
 */

import type { ReactElement } from 'react';
import { TamaguiProvider } from '@tamagui/core';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { tamaguiConfig } from '../src/tamagui.config';

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions,
): RenderResult {
  return render(ui, {
    wrapper: ({ children }) => (
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        {children}
      </TamaguiProvider>
    ),
    ...options,
  });
}

// Re-export so test files import a single entry point.
export { screen, fireEvent, waitFor } from '@testing-library/react';

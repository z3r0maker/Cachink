/**
 * Expo Router entry for /conversion — raw material conversion.
 *
 * Phase 18: real screen replacing the placeholder.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { ConversionScreen } from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function ConversionRoute(): ReactElement {
  const router = useRouter();
  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <ConversionScreen testID="conversion-screen" />
    </AppShellWrapper>
  );
}

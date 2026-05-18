/**
 * DirectorHomeScreen badge slot tests.
 * Phase 11 — Director Notification Inbox.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';
import { DirectorHomeScreen } from '../../src/screens/DirectorHome/director-home-screen';
import { NotificationBadge } from '../../src/components/NotificationBadge/notification-badge';

function renderScreen(badge?: React.ReactNode) {
  return render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <DirectorHomeScreen
        greeting="Hola, Director"
        notificationBadge={badge}
      />
    </TamaguiProvider>,
  );
}

describe('DirectorHomeScreen badge slot', () => {
  it('renders greeting text', () => {
    renderScreen();
    expect(screen.getByText('Hola, Director')).toBeTruthy();
  });

  it('renders the badge slot when provided', () => {
    renderScreen(
      <NotificationBadge count={3} testID="test-badge" />,
    );
    expect(screen.getByTestId('director-home-badge-slot')).toBeTruthy();
    expect(screen.getByTestId('test-badge')).toBeTruthy();
  });

  it('does not render badge slot when not provided', () => {
    renderScreen();
    expect(screen.queryByTestId('director-home-badge-slot')).toBeNull();
  });
});

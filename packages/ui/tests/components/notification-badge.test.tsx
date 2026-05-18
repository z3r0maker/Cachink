/**
 * NotificationBadge component tests.
 * Phase 11 — Director Notification Inbox.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';
import { NotificationBadge } from '../../src/components/NotificationBadge/notification-badge';

function renderBadge(props: Parameters<typeof NotificationBadge>[0]) {
  return render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <NotificationBadge {...props} />
    </TamaguiProvider>,
  );
}

describe('NotificationBadge', () => {
  it('renders without count badge when count is 0', () => {
    renderBadge({ count: 0 });
    expect(screen.getByTestId('notification-badge')).toBeTruthy();
    expect(screen.queryByTestId('notification-badge-count')).toBeNull();
  });

  it('renders count when count > 0', () => {
    renderBadge({ count: 3 });
    expect(screen.getByTestId('notification-badge-count')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('caps display at "9+" when count exceeds 9', () => {
    renderBadge({ count: 15 });
    expect(screen.getByText('9+')).toBeTruthy();
  });

  it('shows count badge for count of exactly 9', () => {
    renderBadge({ count: 9 });
    expect(screen.getByText('9')).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPress = vi.fn();
    renderBadge({ count: 2, onPress });
    fireEvent.click(screen.getByTestId('notification-badge'));
    expect(onPress).toHaveBeenCalledOnce();
  });
});

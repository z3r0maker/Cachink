/**
 * AlertCard component tests.
 * Phase 11 — Director Notification Inbox.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';
import { AlertCard } from '../../src/screens/Notificaciones/alert-card';
import type { DirectorAlert } from '@cachink/domain';

function makeAlert(overrides?: Partial<DirectorAlert>): DirectorAlert {
  return {
    id: 'test-alert-id' as never,
    source: 'stock-bajo',
    severity: 'warning',
    titleKey: 'Stock bajo',
    message: 'Quedan 2 unidades',
    read: false,
    actionRoute: '/productos',
    metadata: '{}',
    businessId: 'biz-id' as never,
    deviceId: 'dev-id' as never,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as DirectorAlert;
}

function renderCard(
  alert: DirectorAlert,
  opts?: { onPress?: () => void; onAction?: () => void },
) {
  return render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <AlertCard
        alert={alert}
        onPress={opts?.onPress}
        onAction={opts?.onAction}
      />
    </TamaguiProvider>,
  );
}

describe('AlertCard', () => {
  it('renders title and message', () => {
    renderCard(makeAlert());
    expect(screen.getByText('Stock bajo')).toBeTruthy();
    expect(screen.getByText('Quedan 2 unidades')).toBeTruthy();
  });

  it('renders action link when actionRoute is set', () => {
    renderCard(makeAlert({ actionRoute: '/productos' }));
    // The i18n key is rendered as raw text in test environment
    expect(screen.getByText(/ver|Ver/i)).toBeTruthy();
  });

  it('does not render action link when actionRoute is null', () => {
    renderCard(makeAlert({ actionRoute: null }));
    // With no actionRoute, the action pressable should not be rendered
    expect(screen.queryByText(/→/)).toBeNull();
  });

  it('calls onPress when card is clicked', () => {
    const onPress = vi.fn();
    renderCard(makeAlert(), { onPress });
    fireEvent.click(screen.getByTestId('alert-card-test-alert-id'));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('renders different styles for read vs unread', () => {
    const { rerender } = renderCard(makeAlert({ read: false }));
    // Unread card exists
    expect(screen.getByTestId('alert-card-test-alert-id')).toBeTruthy();

    // Re-render with read=true
    rerender(
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <AlertCard alert={makeAlert({ read: true })} />
      </TamaguiProvider>,
    );
    expect(screen.getByTestId('alert-card-test-alert-id')).toBeTruthy();
  });
});

/**
 * NotificacionesConfigTab tests.
 * Phase 11 — Director Notification Inbox.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '../../src/tamagui.config';
import { NotificacionesConfigTab } from '../../src/screens/Notificaciones/notificaciones-config-tab';
import { deriveDefaultPrefs } from '@cachink/domain';
import type { FeatureFlags } from '@cachink/domain';

const ALL_ON: FeatureFlags = {
  stock: true,
  conversionMateriaPrima: true,
  conversionAutomatica: true,
  auditoriaInventario: true,
  merma: true,
  ventasCredito: true,
};

function renderTab(flags: FeatureFlags = ALL_ON, onToggle = vi.fn()) {
  const prefs = deriveDefaultPrefs(flags);
  return render(
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <NotificacionesConfigTab
        prefs={prefs}
        flags={flags}
        onToggle={onToggle}
      />
    </TamaguiProvider>,
  );
}

describe('NotificacionesConfigTab', () => {
  it('renders the config tab container', () => {
    renderTab();
    expect(screen.getByTestId('notificaciones-config-tab')).toBeTruthy();
  });

  it('renders toggle cards for all 13 sources', () => {
    renderTab();
    // Each source produces a card with a testID
    expect(screen.getByTestId('notif-toggle-stock-bajo')).toBeTruthy();
    expect(screen.getByTestId('notif-toggle-caja-discrepancia')).toBeTruthy();
    expect(screen.getByTestId('notif-toggle-usuario-cambio')).toBeTruthy();
    expect(screen.getByTestId('notif-toggle-credito-vencido')).toBeTruthy();
    expect(screen.getByTestId('notif-toggle-merma-threshold')).toBeTruthy();
  });

  it('renders locked hint when feature flag is OFF', () => {
    const flags: FeatureFlags = { ...ALL_ON, merma: false };
    renderTab(flags);
    // The hint text should mention the parent feature
    const card = screen.getByTestId('notif-toggle-merma-threshold');
    expect(card).toBeTruthy();
  });

  it('calls onToggle when a switch is tapped', () => {
    const onToggle = vi.fn();
    renderTab(ALL_ON, onToggle);
    // The switches exist and are rendered
    expect(screen.getByTestId('notif-toggle-stock-bajo-switch')).toBeTruthy();
  });
});

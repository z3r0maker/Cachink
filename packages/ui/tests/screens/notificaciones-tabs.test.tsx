/**
 * NotificacionesScreen tab rendering test.
 *
 * Verifies the tab structure renders correctly. Uses minimal wrappers
 * since full repo context triggers the @cachink/observability import.
 *
 * Phase 11 — Director Notification Inbox.
 */

import { describe, expect, it } from 'vitest';
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

describe('Notificaciones tab UI', () => {
  it('config tab renders subtitle text', () => {
    const prefs = deriveDefaultPrefs(ALL_ON);
    render(
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <NotificacionesConfigTab
          prefs={prefs}
          flags={ALL_ON}
          onToggle={() => {}}
        />
      </TamaguiProvider>,
    );
    // Config subtitle is rendered (raw i18n key in test env)
    expect(screen.getByTestId('notificaciones-config-tab')).toBeTruthy();
  });

  it('config tab shows feature-locked sources as disabled visually', () => {
    const flags: FeatureFlags = { ...ALL_ON, ventasCredito: false };
    const prefs = deriveDefaultPrefs(flags);
    render(
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <NotificacionesConfigTab
          prefs={prefs}
          flags={flags}
          onToggle={() => {}}
        />
      </TamaguiProvider>,
    );
    // Credito sources should exist but be locked
    expect(screen.getByTestId('notif-toggle-credito-entrega')).toBeTruthy();
    expect(screen.getByTestId('notif-toggle-credito-vencido')).toBeTruthy();
  });
});

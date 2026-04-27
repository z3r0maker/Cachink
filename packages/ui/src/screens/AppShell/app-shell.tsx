/**
 * AppShell — the sticky chrome wrapping every post-wizard screen
 * (P1C-M1-T02, T03).
 *
 * Layout: TopBar (role chip + title + settings cog + sync badge) →
 * children → BottomTabBar (3 tabs for Operativo, 6 for Director). The
 * tab list is picked via `tabsForRole` per CLAUDE.md §1.
 *
 * Consumers (both app-shell route wrappers) pass:
 *   - role + activeTabKey — drive which tab set is rendered + which is
 *     active.
 *   - onNavigate(path) — called when a tab is tapped. The app-shell
 *     route wrapper plugs Expo Router / wouter here.
 *   - onChangeRole — called when "Cambiar" is tapped. Typically clears
 *     the role in Zustand and routes to `/role-picker`.
 *   - onOpenSettings — called when the settings cog is tapped.
 *   - title / subtitle — current screen's title.
 *   - mode — drives the sync-state badge; local-standalone renders none.
 */

import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import { BottomTabBar, Btn, Icon, InitialsAvatar, TopBar } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import type { AppMode, Role } from '../../app-config/index';
import { tabsForRole } from './tab-definitions';
import { SyncStatusBadge } from './sync-status-badge';
import { useLanSync } from '../../hooks/use-lan-sync';

export interface AppShellProps {
  readonly role: Role;
  readonly activeTabKey: string;
  readonly onNavigate: (path: string) => void;
  readonly onChangeRole: () => void;
  readonly onOpenSettings: () => void;
  readonly title?: string;
  readonly subtitle?: string;
  readonly mode: AppMode | null;
  readonly children: ReactNode;
  /**
   * Optional source string for the TopBar's left avatar. Operativo
   * passes the business name (`'Panadería La Esquina'` → `'PA'`),
   * Director passes the role abbreviation (`'DIR'`). Falls back to
   * the localised role label when omitted.
   *
   * Per ADR-040 the legacy `RoleChip` + "Cambiar" Btn collapsed into
   * a single tappable `<InitialsAvatar>`; tapping the avatar fires
   * `onChangeRole`.
   */
  readonly avatarValue?: string;
  readonly testID?: string;
}

interface RoleAvatarProps {
  readonly role: Role;
  readonly value: string;
  readonly onChange: () => void;
  readonly ariaLabel: string;
}

function RoleAvatar(props: RoleAvatarProps): ReactElement {
  return (
    <InitialsAvatar
      testID="top-bar-role-chip"
      value={props.value}
      variant={props.role === 'director' ? 'dark' : 'brand'}
      onPress={props.onChange}
      ariaLabel={props.ariaLabel}
      size="md"
    />
  );
}

interface RightSlotProps {
  readonly mode: AppMode | null;
  readonly onOpenSettings: () => void;
}

function RightSlot(props: RightSlotProps): ReactElement {
  const { t } = useTranslation();
  const lan = useLanSync();
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      <SyncStatusBadge
        mode={props.mode}
        lanStatus={lan.status}
        connectedDevices={lan.connectedDevices}
        onRetry={
          props.mode === 'lan-server' || props.mode === 'lan-client'
            ? () => void lan.retryNow()
            : undefined
        }
      />
      {/*
       * Audit 3.11 + 3.12 — Btn now accepts an icon-only configuration
       * (children optional when icon is set, see PR 2.5). The ariaLabel
       * was hardcoded "Ajustes" which violates CLAUDE.md §8.5
       * (no hardcoded user-facing strings); pulled into the
       * `topBar.openSettings` i18n key.
       */}
      <Btn
        variant="ghost"
        size="sm"
        onPress={props.onOpenSettings}
        testID="top-bar-open-settings"
        ariaLabel={t('topBar.openSettings')}
        icon={<Icon name="settings" size={20} color={colors.black} />}
      />
    </View>
  );
}

export function AppShell(props: AppShellProps): ReactElement {
  const { t } = useTranslation();
  const tabs = tabsForRole(props.role);
  const items = tabs.map((tab) => ({
    key: tab.key,
    label: t(tab.labelKey as 'tabs.ventas'),
    // Pass the IconName as a ReactNode — BottomTabBar's tab-item now
    // recognises Icon elements and re-tints them for active state in
    // UXD-M2-T02. Keeping the wrapping here means tab-item stays a
    // pure presentational primitive.
    icon: <Icon name={tab.icon} size={22} color={colors.black} />,
    onPress: () => props.onNavigate(tab.path),
    testID: `tab-${tab.key}`,
  }));

  // Avatar source: caller-provided business / user name → fall back
  // to the localised role label so the TopBar always renders 1–3
  // initials.
  const avatarValue = props.avatarValue ?? t(`roles.${props.role}` as const);
  const changeLabel = t('topBar.cambiarRol');

  return (
    <View testID={props.testID ?? 'app-shell'} flex={1} backgroundColor={colors.offwhite}>
      <TopBar
        title={props.title}
        subtitle={props.subtitle}
        left={
          <RoleAvatar
            role={props.role}
            value={avatarValue}
            onChange={props.onChangeRole}
            ariaLabel={changeLabel}
          />
        }
        right={<RightSlot mode={props.mode} onOpenSettings={props.onOpenSettings} />}
      />
      <View flex={1}>{props.children}</View>
      <BottomTabBar items={items} activeKey={props.activeTabKey} />
    </View>
  );
}

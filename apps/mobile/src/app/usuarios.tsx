/**
 * Expo Router entry for /usuarios — Director-only user management.
 *
 * Thin wrapper around `UsuariosContent` (packages/ui). Provides
 * the platform-specific delete confirmation via `Alert.alert`.
 *
 * Refactored per CLAUDE.md §6 (40-line budget).
 */

import type { ReactElement } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { UsuariosContent } from '@cachink/ui';
import type { User } from '@cachink/domain';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function UsuariosRoute(): ReactElement {
  const router = useRouter();

  function handleConfirmDelete(
    user: User,
    onConfirmed: () => void,
  ): void {
    Alert.alert(
      'Eliminar usuario',
      `¿Seguro que deseas eliminar a ${user.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: onConfirmed,
        },
      ],
    );
  }

  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <UsuariosContent
        onConfirmDelete={handleConfirmDelete}
        testID="usuarios-route"
      />
    </AppShellWrapper>
  );
}

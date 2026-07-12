/**
 * UserAvatar + UserAvatarGrid tests — Login/user-avatar.tsx coverage.
 *
 * Covers initial rendering, role badge text, avatar grid layout,
 * and user selection callbacks.
 */

import { describe, expect, it, vi } from 'vitest';
import type { UserId } from '@cachink/domain';
import { makeUser } from '@cachink/testing';
import { UserAvatar, UserAvatarGrid } from '../../../src/screens/Login/user-avatar';
import { initI18n } from '../../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../../test-utils';

initI18n();

const DIRECTOR = makeUser({
  id: '01JPHK0000000000000000USR1' as UserId,
  nombre: 'Ana Director',
  role: 'director',
  avatarColor: 'blue',
});

const OPERATIVO = makeUser({
  id: '01JPHK0000000000000000USR2' as UserId,
  nombre: 'Beto Operativo',
  role: 'operativo',
  avatarColor: 'green',
});

describe('UserAvatar', () => {
  it('renders with a testID based on user id', () => {
    renderWithProviders(
      <UserAvatar user={DIRECTOR} onPress={vi.fn()} selected={false} anySelected={false} />,
    );
    expect(screen.getByTestId(`user-avatar-${DIRECTOR.id}`)).toBeInTheDocument();
  });

  it('displays the first initial of the user name', () => {
    renderWithProviders(
      <UserAvatar user={DIRECTOR} onPress={vi.fn()} selected={false} anySelected={false} />,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows Director role badge for director', () => {
    renderWithProviders(
      <UserAvatar user={DIRECTOR} onPress={vi.fn()} selected={false} anySelected={false} />,
    );
    expect(screen.getByTestId(`user-role-${DIRECTOR.id}`)).toBeInTheDocument();
    expect(screen.getByText('Director')).toBeInTheDocument();
  });

  it('shows Operativo role badge for operativo', () => {
    renderWithProviders(
      <UserAvatar user={OPERATIVO} onPress={vi.fn()} selected={false} anySelected={false} />,
    );
    expect(screen.getByText('Operativo')).toBeInTheDocument();
  });

  it('displays the user name', () => {
    renderWithProviders(
      <UserAvatar user={DIRECTOR} onPress={vi.fn()} selected={false} anySelected={false} />,
    );
    expect(screen.getByText('Ana Director')).toBeInTheDocument();
  });

  it('fires onPress when clicked', () => {
    const onPress = vi.fn();
    renderWithProviders(
      <UserAvatar user={DIRECTOR} onPress={onPress} selected={false} anySelected={false} />,
    );
    fireEvent.click(screen.getByTestId(`user-avatar-${DIRECTOR.id}`));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('UserAvatarGrid', () => {
  it('renders all user avatars', () => {
    renderWithProviders(
      <UserAvatarGrid
        users={[DIRECTOR, OPERATIVO]}
        selectedUserId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByTestId(`user-avatar-${DIRECTOR.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`user-avatar-${OPERATIVO.id}`)).toBeInTheDocument();
  });

  it('calls onSelect with user ID when avatar is clicked', () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <UserAvatarGrid
        users={[DIRECTOR, OPERATIVO]}
        selectedUserId={null}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByTestId(`user-avatar-${OPERATIVO.id}`));
    expect(onSelect).toHaveBeenCalledWith(OPERATIVO.id);
  });

  it('renders with empty user list', () => {
    renderWithProviders(
      <UserAvatarGrid users={[]} selectedUserId={null} onSelect={vi.fn()} />,
    );
    // Should not crash
    expect(screen.queryByTestId(/user-avatar-/)).toBeNull();
  });

  it('passes selectedUserId to avatars', () => {
    renderWithProviders(
      <UserAvatarGrid
        users={[DIRECTOR, OPERATIVO]}
        selectedUserId={DIRECTOR.id}
        onSelect={vi.fn()}
      />,
    );
    // Both should still be visible
    expect(screen.getByTestId(`user-avatar-${DIRECTOR.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`user-avatar-${OPERATIVO.id}`)).toBeInTheDocument();
  });
});

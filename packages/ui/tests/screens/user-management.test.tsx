/**
 * UserManagement tests — UserListScreen + CreateUserModal coverage.
 *
 * Covers user list rendering, create/edit/delete button wiring,
 * create modal form validation, and submit gating.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import type { UserId } from '@cachink/domain';
import { makeUser } from '@cachink/testing';
import { UserListScreen } from '../../src/screens/UserManagement/user-list-screen';
import { CreateUserModal } from '../../src/screens/UserManagement/create-user-modal';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const DIRECTOR = makeUser({
  id: '01JPHK0000000000000000USR1' as UserId,
  nombre: 'Ana Director',
  role: 'director',
});
const OPERATIVO = makeUser({
  id: '01JPHK0000000000000000USR2' as UserId,
  nombre: 'Beto Operativo',
  role: 'operativo',
});

describe('UserListScreen', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders with default testID user-list', () => {
    renderWithProviders(
      <UserListScreen users={[]} onCreateUser={vi.fn()} onEditUser={vi.fn()} onDeleteUser={vi.fn()} />,
    );
    expect(screen.getByTestId('user-list')).toBeInTheDocument();
  });

  it('renders a row per user', () => {
    renderWithProviders(
      <UserListScreen users={[DIRECTOR, OPERATIVO]} onCreateUser={vi.fn()} onEditUser={vi.fn()} onDeleteUser={vi.fn()} />,
    );
    expect(screen.getByText('Ana Director')).toBeInTheDocument();
    expect(screen.getByText('Beto Operativo')).toBeInTheDocument();
  });

  it('shows role labels', () => {
    renderWithProviders(
      <UserListScreen users={[DIRECTOR, OPERATIVO]} onCreateUser={vi.fn()} onEditUser={vi.fn()} onDeleteUser={vi.fn()} />,
    );
    expect(screen.getByText('Director')).toBeInTheDocument();
    expect(screen.getByText('Operativo')).toBeInTheDocument();
  });

  it('renders the create button', () => {
    renderWithProviders(
      <UserListScreen users={[]} onCreateUser={vi.fn()} onEditUser={vi.fn()} onDeleteUser={vi.fn()} />,
    );
    expect(screen.getByTestId('user-create-btn')).toBeInTheDocument();
  });

  it('calls onCreateUser when create button is clicked', () => {
    const onCreateUser = vi.fn();
    renderWithProviders(
      <UserListScreen users={[]} onCreateUser={onCreateUser} onEditUser={vi.fn()} onDeleteUser={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId('user-create-btn'));
    expect(onCreateUser).toHaveBeenCalled();
  });

  it('calls onEditUser when edit icon is clicked', () => {
    const onEditUser = vi.fn();
    renderWithProviders(
      <UserListScreen users={[DIRECTOR]} onCreateUser={vi.fn()} onEditUser={onEditUser} onDeleteUser={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId(`user-edit-${DIRECTOR.id}`));
    expect(onEditUser).toHaveBeenCalledWith(DIRECTOR);
  });

  it('calls onDeleteUser when delete icon is clicked', () => {
    const onDeleteUser = vi.fn();
    renderWithProviders(
      <UserListScreen users={[DIRECTOR]} onCreateUser={vi.fn()} onEditUser={vi.fn()} onDeleteUser={onDeleteUser} />,
    );
    fireEvent.click(screen.getByTestId(`user-del-${DIRECTOR.id}`));
    expect(onDeleteUser).toHaveBeenCalledWith(DIRECTOR);
  });
});

describe('CreateUserModal', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders with default testID create-user-modal', () => {
    renderWithProviders(
      <CreateUserModal onSubmit={vi.fn()} onCancel={vi.fn()} submitting={false} />,
    );
    expect(screen.getByTestId('create-user-modal')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderWithProviders(
      <CreateUserModal onSubmit={vi.fn()} onCancel={vi.fn()} submitting={false} />,
    );
    expect(screen.getByTestId('new-user-nombre')).toBeInTheDocument();
    expect(screen.getByTestId('new-user-role')).toBeInTheDocument();
    expect(screen.getByTestId('new-user-pin')).toBeInTheDocument();
    expect(screen.getByTestId('new-user-recovery-password')).toBeInTheDocument();
  });

  it('renders cancel and submit buttons', () => {
    renderWithProviders(
      <CreateUserModal onSubmit={vi.fn()} onCancel={vi.fn()} submitting={false} />,
    );
    expect(screen.getByTestId('create-user-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('create-user-submit')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    renderWithProviders(
      <CreateUserModal onSubmit={vi.fn()} onCancel={onCancel} submitting={false} />,
    );
    fireEvent.click(screen.getByTestId('create-user-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('does not submit when form is empty', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <CreateUserModal onSubmit={onSubmit} onCancel={vi.fn()} submitting={false} />,
    );
    fireEvent.click(screen.getByTestId('create-user-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <CreateUserModal onSubmit={vi.fn()} onCancel={vi.fn()} submitting={false} testID="my-modal" />,
    );
    expect(screen.getByTestId('my-modal')).toBeInTheDocument();
  });
});

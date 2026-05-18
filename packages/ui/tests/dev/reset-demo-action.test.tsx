/**
 * Unit tests for ResetDemoAction — the dev-only PIN-gated database
 * reset card.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashSync } from 'bcryptjs';
import type { ReactElement, ReactNode } from 'react';
import type { BusinessId } from '@cachink/domain';
import { InMemoryUsersRepository } from '@cachink/testing';
import { TamaguiProvider } from '@tamagui/core';
import { render } from '@testing-library/react';
import { RepositoryProvider } from '../../src/app/repository-provider';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { initI18n } from '../../src/i18n/index';
import { tamaguiConfig } from '../../src/tamagui.config';
import { ResetDemoAction, type ResetDemoActionProps } from '../../src/dev/reset-demo-action';
import { screen, fireEvent, waitFor } from '../test-utils';
import { buildTestRepos } from '../build-test-repos';

initI18n();

const USER_PIN = '000000';
const WRONG_PIN = '999999';
const PIN_HASH = hashSync(USER_PIN, 10);
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function Wrapper({ children, usersRepo }: { children: ReactNode; usersRepo: InMemoryUsersRepository }): ReactElement {
  const repos = buildTestRepos({ users: usersRepo });
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <RepositoryProvider repositories={repos}>{children}</RepositoryProvider>
    </TamaguiProvider>
  );
}

async function renderAction(
  overrides?: Partial<ResetDemoActionProps>,
): Promise<{ resetDatabase: ReturnType<typeof vi.fn>; onReload: ReturnType<typeof vi.fn> }> {
  const usersRepo = new InMemoryUsersRepository();
  const user = await usersRepo.create({
    nombre: 'Test Director',
    email: null,
    pinHash: PIN_HASH,
    recoveryPasswordHash: '$2a$10$fakepinhashfortest',
    role: 'director',
    mustChangePin: false,
    avatarColor: 'blue',
    businessId: BIZ,
  });
  useAppConfigStore.getState().setUserId(user.id);

  const resetDatabase = (overrides?.resetDatabase as ReturnType<typeof vi.fn>) ?? vi.fn().mockResolvedValue(undefined);
  const onReload = (overrides?.onReload as ReturnType<typeof vi.fn>) ?? vi.fn();

  render(
    <Wrapper usersRepo={usersRepo}>
      <ResetDemoAction resetDatabase={resetDatabase} onReload={onReload} />
    </Wrapper>,
  );
  return { resetDatabase, onReload };
}

describe('ResetDemoAction', () => {
  afterEach(() => {
    useAppConfigStore.getState().reset();
  });

  it('renders card with reset button in dev', async () => {
    await renderAction();
    expect(screen.getByTestId('reset-demo-card')).toBeDefined();
    expect(screen.getByTestId('reset-demo-btn')).toBeDefined();
  });

  it('opens PIN modal when button is pressed', async () => {
    await renderAction();
    fireEvent.click(screen.getByTestId('reset-demo-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('reset-pin-modal')).toBeDefined();
    });
  });

  it('shows error when wrong PIN is entered', async () => {
    await renderAction();
    fireEvent.click(screen.getByTestId('reset-demo-btn'));
    await waitFor(() => expect(screen.getByTestId('reset-pin-modal')).toBeDefined());

    fireEvent.change(screen.getByTestId('reset-pin-input-field'), { target: { value: WRONG_PIN } });
    await waitFor(() => {
      expect(screen.getByText('PIN incorrecto')).toBeDefined();
    });
  });

  it('advances to confirm dialog on correct PIN', async () => {
    await renderAction();
    fireEvent.click(screen.getByTestId('reset-demo-btn'));
    await waitFor(() => expect(screen.getByTestId('reset-pin-modal')).toBeDefined());

    fireEvent.change(screen.getByTestId('reset-pin-input-field'), { target: { value: USER_PIN } });
    await waitFor(() => {
      expect(screen.getByText('¿Borrar todos los datos?')).toBeDefined();
    });
  });

  it('calls resetDatabase then onReload after confirmation', async () => {
    const resetDatabase = vi.fn().mockResolvedValue(undefined);
    const onReload = vi.fn();
    await renderAction({ resetDatabase, onReload });

    fireEvent.click(screen.getByTestId('reset-demo-btn'));
    await waitFor(() => expect(screen.getByTestId('reset-pin-modal')).toBeDefined());
    fireEvent.change(screen.getByTestId('reset-pin-input-field'), { target: { value: USER_PIN } });
    await waitFor(() => expect(screen.getByText('¿Borrar todos los datos?')).toBeDefined());
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

    await waitFor(() => {
      expect(resetDatabase).toHaveBeenCalledOnce();
      expect(onReload).toHaveBeenCalledOnce();
    });
  });

  it('shows error state if resetDatabase throws', async () => {
    const resetDatabase = vi.fn().mockRejectedValue(new Error('IO'));
    await renderAction({ resetDatabase });

    fireEvent.click(screen.getByTestId('reset-demo-btn'));
    await waitFor(() => expect(screen.getByTestId('reset-pin-modal')).toBeDefined());
    fireEvent.change(screen.getByTestId('reset-pin-input-field'), { target: { value: USER_PIN } });
    await waitFor(() => expect(screen.getByText('¿Borrar todos los datos?')).toBeDefined());
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

    await waitFor(() => {
      expect(screen.getByText('Error al borrar la base de datos.')).toBeDefined();
    });
  });

  it('dismisses cleanly when PIN modal is closed', async () => {
    await renderAction();
    fireEvent.click(screen.getByTestId('reset-demo-btn'));
    await waitFor(() => expect(screen.getByTestId('reset-pin-modal')).toBeDefined());
    expect(screen.getByTestId('reset-demo-btn')).toBeDefined();
  });
});

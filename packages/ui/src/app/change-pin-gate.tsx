/**
 * ChangePinGate — forced PIN change on first login.
 *
 * Renders the ChangePinScreen and handles the PIN change.
 * ADR-049: PIN for login, Password for recovery.
 */

import { useState, type ReactElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUsersRepository } from './repository-provider';
import { useUserId, useSetMustChangePin } from '../app-config/use-app-config';
import { ChangePinScreen } from '../screens/Login/index';
import { CambiarPinUseCase } from '@cachink/application';

function useChangePinSubmit() {
  const users = useUsersRepository();
  const userId = useUserId();
  const setMustChangePin = useSetMustChangePin();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (currentPin: string, newPin: string): Promise<void> => {
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    try {
      await new CambiarPinUseCase(users).execute({ userId, currentPin, newPin });
      setMustChangePin(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar PIN');
    } finally {
      setSubmitting(false);
    }
  };
  return { userId, users, error, submitting, handleSubmit };
}

export function ChangePinGate(): ReactElement {
  const { userId, users, error, submitting, handleSubmit } = useChangePinSubmit();
  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => (userId ? users.findById(userId) : null),
    enabled: userId !== null,
  });
  return (
    <ChangePinScreen
      userName={userQuery.data?.nombre ?? 'Usuario'}
      onSubmit={handleSubmit}
      error={error}
      submitting={submitting}
    />
  );
}

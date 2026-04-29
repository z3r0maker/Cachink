/**
 * Expo Router entry for the wizard's business-creation step
 * (P1C-M2-T05).
 *
 * Wraps the shared `BusinessForm` and wires its submit callback to the
 * `useCrearBusiness` mutation, which writes to BusinessesRepository +
 * AppConfig + store. On success, the router drops the user on
 * /role-picker.
 *
 * ## Audit fix — missing `onError` handler
 *
 * Without an `onError` callback the mutation failure was swallowed
 * silently — the user tapped "Guardar" and nothing happened. Now
 * surfaces a native Alert with the error message so the user knows
 * what went wrong (SQLite error, validation gap, etc.).
 */

import type { ReactElement } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { BusinessForm, useCrearBusiness, type BusinessFormSubmitInput } from '@cachink/ui';

export default function WizardBusinessRoute(): ReactElement {
  const router = useRouter();
  const crearBusiness = useCrearBusiness();
  function handleSubmit(input: BusinessFormSubmitInput): void {
    crearBusiness.mutate(input, {
      onSuccess() {
        router.replace('/role-picker');
      },
      onError(err: Error) {
        Alert.alert(
          'Error al crear negocio',
          err.message ?? 'Ocurrió un error inesperado. Intenta de nuevo.',
        );
      },
    });
  }
  return <BusinessForm onSubmit={handleSubmit} submitting={crearBusiness.isPending} />;
}

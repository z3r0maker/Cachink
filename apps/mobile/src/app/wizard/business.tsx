/**
 * Expo Router entry for the wizard's business-creation step
 * (P1C-M2-T05).
 *
 * Wraps the shared `BusinessForm` and wires its submit callback to the
 * `useCrearBusiness` mutation, which writes to BusinessesRepository +
 * AppConfig + store. On success, the router drops the user on
 * /role-picker.
 */

import type { ReactElement } from 'react';
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
    });
  }
  return <BusinessForm onSubmit={handleSubmit} submitting={crearBusiness.isPending} />;
}

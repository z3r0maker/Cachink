/**
 * Expo Router entry for the wizard's business-type step.
 *
 * Renders the shared `BusinessType` screen and forwards the user's
 * choice to `/wizard/business`. The selected `BusinessTypeChoice` is
 * stored in AppConfig so the subsequent BusinessForm can read it and
 * the `Business` entity gets the right `tipoNegocio`, category default,
 * and attribute definitions.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  APP_CONFIG_KEYS,
  BusinessType,
  useAppConfigRepository,
  type BusinessTypeChoice,
} from '@cachink/ui';

export default function WizardBusinessTypeRoute(): ReactElement {
  const router = useRouter();
  const appConfig = useAppConfigRepository();

  async function handleSelect(choice: BusinessTypeChoice): Promise<void> {
    await appConfig.set(APP_CONFIG_KEYS.tipoNegocio, choice.tipoNegocio);
    await appConfig.set(
      APP_CONFIG_KEYS.categoriaVentaPredeterminada,
      choice.categoriaVentaPredeterminada,
    );
    if (choice.atributosProducto.length > 0) {
      await appConfig.set(
        APP_CONFIG_KEYS.atributosProducto,
        JSON.stringify(choice.atributosProducto),
      );
    }
    router.replace('/wizard/business');
  }

  return (
    <BusinessType
      onSelect={(choice) => {
        void handleSelect(choice);
      }}
    />
  );
}

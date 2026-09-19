/**
 * useDemoMode — one-tap hook that creates a business, seeds all demo
 * data, auto-logs in as Director, and drops straight into the app.
 *
 * Returns `undefined` in production builds so the wizard link is
 * never rendered (tree-shaken out). In dev, returns an async callback.
 *
 * All PINs default to "0000" (Director + Operativo; ADR-072).
 */

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { BusinessId, DeviceId, UserId } from '@xangarro/domain';
import { useRepositories } from '../app/repository-provider';
import { useAppConfigRepository } from '../app/repository-provider';
import {
  APP_CONFIG_KEYS,
  useSetMode,
  useSetCurrentBusinessId,
  useSetUserId,
  useSetUserRole,
  useSetMustChangePin,
  useSetDiscoveryShown,
  useDeviceId,
} from '../app-config/index';
import { seedDemoData } from './seed-demo-data';

const PLACEHOLDER_BIZ = '01JPHK00000000000000000000' as BusinessId;
const PLACEHOLDER_DEV = '01JPHK00000000000000000001' as DeviceId;

const ALL_FEATURES_ON = JSON.stringify({
  stock: true,
  conversionMateriaPrima: true,
  conversionAutomatica: false,
  caja: true,
  auditoriaInventario: true,
  merma: true,
  ventasCredito: true,
});

export interface DemoModeState {
  readonly trigger: () => void;
  readonly loading: boolean;
}

/**
 * Returns `undefined` in production → the wizard link is hidden.
 * In dev, returns `{ trigger, loading }` for the wizard to call.
 */
export function useDemoMode(): DemoModeState | undefined {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return undefined;

  return useDemoModeInner();
}

/** Phase-1 result passed from DB writes to Zustand update. */
interface SeedResult {
  readonly businessId: BusinessId;
  readonly directorId: UserId | null;
}

/**
 * Phase 1 — all database writes. No Zustand mutations, no re-renders.
 * Returns the IDs needed for the atomic Phase 2 burst.
 */
async function seedToDatabase(
  repos: ReturnType<typeof useRepositories>,
  appConfig: ReturnType<typeof useAppConfigRepository>,
  deviceId: DeviceId | null,
): Promise<SeedResult> {
  // NOTE: mode is intentionally NOT set here. It's set in the atomic
  // Zustand burst (Phase 2) after ALL seeding completes, to avoid a
  // race where GatedNavigation unmounts the WizardGate before data is
  // ready — producing a blank screen.

  const business = await repos.businesses.create({
    nombre: 'Tortillería La Esperanza',
    regimenFiscal: 'RIF',
    isrTasa: 3000,
    logoUrl: null,
    brandColor: null,
    receiptTemplate: 'clasico',
    receiptLeyenda: null,
    addressPrint: false,
    whatsapp: null,
    socialLinks: '{}',
    tipoNegocio: 'mixto',
    categoriaVentaPredeterminada: 'Producto',
    atributosProducto: [],
    enabledPaymentMethods: '["Efectivo","Transferencia","Tarjeta","QR/CoDi"]',
    featureFlags: ALL_FEATURES_ON,
    businessId: PLACEHOLDER_BIZ,
    deviceId: deviceId ?? PLACEHOLDER_DEV,
    createdByUserId: null,
  });

  await appConfig.set(APP_CONFIG_KEYS.currentBusinessId, business.id);
  await seedDemoData({
    repositories: repos,
    businessId: business.id,
    deviceId: deviceId ?? PLACEHOLDER_DEV,
  });

  const users = await repos.users.findAllByBusiness(business.id);
  const director = users.find((u) => u.role === 'director');

  await appConfig.set(APP_CONFIG_KEYS.discoveryShown, 'true');

  return { businessId: business.id, directorId: director?.id ?? null };
}

interface SeedSetters {
  readonly setMode: ReturnType<typeof useSetMode>;
  readonly setBusinessId: ReturnType<typeof useSetCurrentBusinessId>;
  readonly setUserId: ReturnType<typeof useSetUserId>;
  readonly setUserRole: ReturnType<typeof useSetUserRole>;
  readonly setMustChangePin: ReturnType<typeof useSetMustChangePin>;
  readonly setDiscoveryShown: ReturnType<typeof useSetDiscoveryShown>;
}

/** Atomic Zustand update once the demo business is seeded (single render burst). */
function applySeededIdentity(
  s: SeedSetters,
  seeded: Awaited<ReturnType<typeof seedToDatabase>>,
): void {
  s.setMode('local');
  s.setBusinessId(seeded.businessId);
  if (seeded.directorId) {
    s.setUserId(seeded.directorId);
    s.setUserRole('director');
    s.setMustChangePin(false);
  }
  s.setDiscoveryShown(true);
}

/**
 * Separated inner hook so the production guard doesn't change
 * the number of hooks called (conditional early return is above
 * all hook calls).
 */
function useDemoModeInner(): DemoModeState {
  const repos = useRepositories();
  const appConfig = useAppConfigRepository();
  const setMode = useSetMode();
  const setBusinessId = useSetCurrentBusinessId();
  const setUserId = useSetUserId();
  const setUserRole = useSetUserRole();
  const setMustChangePin = useSetMustChangePin();
  const setDiscoveryShown = useSetDiscoveryShown();
  const queryClient = useQueryClient();
  const deviceId = useDeviceId();

  const [loading, setLoading] = useState(false);

  const trigger = useCallback(async () => {
    setLoading(true);
    try {
      const seeded = await seedToDatabase(repos, appConfig, deviceId);
      // Persist mode to DB now that all demo data is ready, then update state atomically.
      await appConfig.set(APP_CONFIG_KEYS.mode, 'local');
      applySeededIdentity(
        { setMode, setBusinessId, setUserId, setUserRole, setMustChangePin, setDiscoveryShown },
        seeded,
      );
      await queryClient.invalidateQueries({ queryKey: ['currentBusiness'] });
      await queryClient.invalidateQueries({ queryKey: ['users', seeded.businessId] });
    } finally {
      // Small delay lets AuthInner's useAuthGateState query resolve
      // before we drop the DemoSeedingScreen, avoiding a flash of
      // the bare AppLoadingSkeleton.
      setTimeout(() => setLoading(false), 400);
    }
  }, [
    repos,
    appConfig,
    setMode,
    setBusinessId,
    setUserId,
    setUserRole,
    setMustChangePin,
    setDiscoveryShown,
    queryClient,
    deviceId,
  ]);

  return { trigger: () => void trigger(), loading };
}

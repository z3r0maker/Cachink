/**
 * FeatureDiscoveryGate — shows the feature discovery carousel once after
 * the first-run wizard completes (DirectorSetup → first login).
 *
 * KEY CONSTRAINTS:
 * - First-run only — not shown on wizard re-run
 * - Skippable — "Comenzar" button always visible
 * - Reads/writes `discoveryShown` flag in AppConfig repo
 * - Does NOT block the auth flow — renders between auth-success and children
 *
 * Phase 12 of the Feature Flags plan, wired in Phase 15.
 */

import { useCallback, type ReactElement, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { APP_CONFIG_KEYS } from '../app-config/index';
import { useAppConfigRepository } from './repository-provider';
import { FeatureDiscovery } from '../screens/Wizard/index';
import { useFeatureFlag } from '../hooks/use-feature-flags';
import { AppLoadingSkeleton } from './app-loading-skeleton';

const DISCOVERY_KEY = ['appConfig', 'discoveryShown'] as const;

export interface FeatureDiscoveryGateProps {
  readonly children: ReactNode;
}

export function FeatureDiscoveryGate(props: FeatureDiscoveryGateProps): ReactElement | null {
  const appConfig = useAppConfigRepository();
  const queryClient = useQueryClient();
  const stockActive = useFeatureFlag('stock');

  const { data: shown, isLoading } = useQuery({
    queryKey: DISCOVERY_KEY,
    queryFn: async () => {
      const raw = await appConfig.get(APP_CONFIG_KEYS.discoveryShown);
      return raw === 'true';
    },
  });

  const markShown = useMutation({
    mutationFn: async () => {
      await appConfig.set(APP_CONFIG_KEYS.discoveryShown, 'true');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DISCOVERY_KEY });
    },
  });

  const handleContinue = useCallback(() => {
    markShown.mutate();
  }, [markShown]);

  // While loading, show a spinner so there's no blank flash.
  if (isLoading) return <AppLoadingSkeleton />;

  // Already shown → render children (the main app).
  if (shown) return <>{props.children}</>;

  // First run: show the feature discovery carousel.
  return <FeatureDiscovery stockActive={stockActive} onContinue={handleContinue} />;
}

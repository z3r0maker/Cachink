/**
 * ActivationProvider — makes the injected ActivationConfig and a shared
 * ApiClient available to the activation gate and, later, the sync engine.
 */

import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from 'react';
import { ApiClient } from '@xangarro/sync';
import { DEFAULT_ACTIVATION_CONFIG, type ActivationConfig } from './activation-config';

interface ActivationContextValue {
  readonly config: ActivationConfig;
  readonly client: ApiClient;
}

/**
 * Default value = the in-memory dev config, so stories and unit tests that
 * mount gates without AppProviders still work. AppProviders always passes
 * the real config from the app shell.
 */
const DEFAULT_VALUE: ActivationContextValue = {
  config: DEFAULT_ACTIVATION_CONFIG,
  client: new ApiClient({ baseUrl: DEFAULT_ACTIVATION_CONFIG.apiBase }),
};

const ActivationContext = createContext<ActivationContextValue>(DEFAULT_VALUE);

export function ActivationProvider(props: {
  readonly config?: ActivationConfig;
  readonly children: ReactNode;
}): ReactElement {
  const config = props.config ?? DEFAULT_ACTIVATION_CONFIG;
  const value = useMemo(
    () => ({
      config,
      client: new ApiClient({ baseUrl: config.apiBase, extraHeaders: config.extraHeaders }),
    }),
    [config],
  );
  return <ActivationContext.Provider value={value}>{props.children}</ActivationContext.Provider>;
}

export function useActivationContext(): ActivationContextValue {
  return useContext(ActivationContext);
}

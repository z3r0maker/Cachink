/**
 * Public surface of `@xangarro/ui/app-config`.
 *
 * Re-exports the store hooks, provider, and type definitions so
 * consumers `import { useMode, AppConfigProvider } from '@xangarro/ui'`
 * without reaching into the app-config folder.
 */
export * from './types';
export * from './use-app-config';
export { AppConfigProvider, type AppConfigProviderProps } from './app-config-provider';
export { CLOUD_MODE_ENABLED } from './feature-availability';

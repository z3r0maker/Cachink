/**
 * Public surface of `@cachink/ui/app-config`.
 *
 * Re-exports the store hooks, provider, and type definitions so
 * consumers `import { useRole, AppConfigProvider } from '@cachink/ui'`
 * without reaching into the app-config folder.
 */
export * from './types';
export * from './use-app-config';
export { AppConfigProvider, type AppConfigProviderProps } from './app-config-provider';

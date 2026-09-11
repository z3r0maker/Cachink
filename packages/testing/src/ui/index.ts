/**
 * UI-dependent test helpers — separated from the main barrel so that
 * packages without react-native / @xangarro/ui in their dependency graph
 * (domain, application, data) never transitively load react-native-svg.
 *
 * Import from `@xangarro/testing/ui` instead of `@xangarro/testing`.
 * See the `./contract` subpath for the same pattern applied to vitest-
 * dependent contract-test factories.
 */
export {
  MockRepositoryProvider,
  type MockRepositoryProviderProps,
} from '../mock-repository-provider.js';

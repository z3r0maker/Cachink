/**
 * Mock for react-native-safe-area-context in Vitest (jsdom).
 *
 * The real package ships Flow/native-only code that Vite can't parse.
 * This provides the minimum surface needed by components under test.
 */

export function useSafeAreaInsets() {
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

export function SafeAreaProvider({ children }: { children: React.ReactNode }) {
  return children;
}

export function SafeAreaView({ children }: { children: React.ReactNode }) {
  return children;
}

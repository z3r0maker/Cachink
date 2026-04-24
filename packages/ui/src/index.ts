/**
 * @cachink/ui — shared cross-platform components.
 *
 * The 11 Phase 1A primitives (Btn, Input, Tag, Modal, EmptyState, SectionTitle,
 * Card, Kpi, Gauge, BottomTabBar, TopBar) land after Phase 0 closes. Today
 * this package exports:
 *   1. Brand theme tokens (the canonical source of truth for colors,
 *      typography, shape, and shadow — see ./theme.ts).
 *   2. `<HelloBadge />` — the Phase 0 proof-of-pipeline component that both
 *      apps render to verify the shared-component pipeline works.
 */
export * from './theme';
export * from './components/index';
export * from './database/index';
export * from './app-config/index';
export * from './app/index';
export * from './hooks/index';
// The Tamagui config has to be mounted in each app's shell via
// <TamaguiProvider config={tamaguiConfig}>. Re-exported here so app shells
// never reach into `@cachink/ui`'s internal paths.
export { tamaguiConfig } from './tamagui.config';
export type { AppTamaguiConfig } from './tamagui.config';

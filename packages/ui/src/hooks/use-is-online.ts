/**
 * `useIsOnline` — connectivity-state hook (ADR-039 wizard safety rails).
 *
 * Default Vite/Tauri/Vitest target uses `navigator.onLine` plus
 * `'online'` / `'offline'` event subscriptions. Mobile (Metro) auto-
 * resolves `./use-is-online.native.ts` which wraps
 * `@react-native-community/netinfo`.
 *
 * Returns `true` when the device claims to be online, `false` when
 * offline. Defensive: when the platform has no connectivity API at all
 * (server-side rendering, very old browsers), assume online so the
 * wizard does not soft-lock the user out of cloud sub-flows.
 */

export { useIsOnline } from './use-is-online.web';

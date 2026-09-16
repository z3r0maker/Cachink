/**
 * Auth gates — the post-activation sign-in step of GatedNavigation.
 * Operators come from the portal (A-05): no first-user setup, no forced PIN
 * change, no recovery on the device.
 */

export { USERS_KEY } from './query-keys-auth';
export { QuickSwitchGate } from './quick-switch-gate';

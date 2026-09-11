/**
 * Cloud-onboarding navigation plumbing — re-export surface for the
 * desktop shell (Round 3 F9 dedup).
 *
 * The shared body lives in
 * `@cachink/ui/sync/cloud-inner-screen-host.tsx`. Both `main.tsx`,
 * `routes/settings-route.tsx`, and `use-cloud-bridges.ts` import
 * from this module so the public shell-level path stays stable.
 */

export {
  CloudInnerScreenHost,
  useCloudNavigation,
  type CloudInnerScreen,
  type UseCloudNavigationResult,
} from '@cachink/ui/sync';

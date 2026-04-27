/**
 * Cloud-onboarding navigation plumbing — re-export surface for the
 * mobile shell (Round 3 F9 dedup).
 *
 * The shared body lives in
 * `@cachink/ui/sync/cloud-inner-screen-host.tsx`. Both `_layout.tsx`
 * and `use-cloud-bridges.ts` import from this module so the public
 * shell-level path stays stable.
 */

export {
  CloudInnerScreenHost,
  useCloudNavigation,
  type CloudInnerScreen,
  type UseCloudNavigationResult,
} from '@cachink/ui/sync';

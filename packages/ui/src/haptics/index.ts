/**
 * Barrel for `@cachink/ui/haptics`.
 *
 * Metro / Vite resolve `haptics.native.ts` on iOS/Android and
 * `haptics.ts` (web no-op) everywhere else — the platform extension
 * mechanism documented in CLAUDE.md §5.3.
 */
export {
  impactLight,
  impactMedium,
  notificationSuccess,
  notificationError,
} from './haptics';

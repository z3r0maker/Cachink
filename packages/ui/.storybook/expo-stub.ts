/**
 * Empty stand-in for Expo native modules inside the Storybook web preview.
 *
 * Nothing reachable from a web story needs an Expo native module — the
 * `.web.*` platform variants exist precisely so it doesn't. But Vite's module
 * graph still walks into `expo-modules-core`, whose `ts-declarations/*` files
 * export TypeScript *types* while `global.ts` imports them as *values*. Vite
 * strips the types, the values are then missing, and every importing story
 * dies with "does not provide an export named 'EventEmitter'".
 *
 * Aliasing to this file cuts the graph before that happens. If a story ever
 * genuinely needs Expo behaviour it will fail loudly on a missing export here,
 * which is the right outcome: that story wants a `.web` variant, not a stub.
 */

/** Stands in for `EventEmitter`, `NativeModule`, `SharedObject`, et al. */
class ExpoStub {
  addListener(): { remove: () => void } {
    return { remove: (): void => undefined };
  }
  removeListener(): void {
    /* no-op */
  }
  removeAllListeners(): void {
    /* no-op */
  }
  emit(): void {
    /* no-op */
  }
}

export const EventEmitter = ExpoStub;
export const NativeModule = ExpoStub;
export const SharedObject = ExpoStub;
export const SharedRef = ExpoStub;
export const requireNativeModule = (): ExpoStub => new ExpoStub();
export const requireOptionalNativeModule = (): null => null;

export default ExpoStub;

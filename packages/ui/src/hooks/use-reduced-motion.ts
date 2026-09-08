/**
 * useReducedMotion — reports whether the OS asks for reduced motion.
 *
 * Reads "Reduce Motion" (iOS Settings › Accessibility › Motion) and "Remove
 * animations" (Android Settings › Accessibility), and subscribes to changes so
 * a user who flips the switch mid-session is honoured without a relaunch. On
 * web, `react-native-web` maps this to the `prefers-reduced-motion` media
 * query.
 *
 * Users with vestibular disorders can be made nauseated or dizzy by movement
 * they did not ask for; WCAG 2.1 SC 2.3.3 (Animation from Interactions) makes
 * honouring the setting a requirement, not a nicety. Cachink animated in ten
 * components and read the setting in none of them until the 2026-09 audit.
 *
 * The contract is *reduce*, not *remove*: a transition that communicates
 * something (a value landing, a row leaving) should still happen, but as an
 * opacity crossfade rather than a slide, scale, or spring. Prefer
 * `motionDuration()` over branching at every call site.
 *
 * ```ts
 * const reduced = useReducedMotion();
 * Animated.timing(v, { toValue: 1, duration: motionDuration(300, reduced), useNativeDriver: true });
 * ```
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Duration a reduced-motion animation collapses to, in ms.
 *
 * Not zero: an instant swap can read as a glitch, and RN still needs a tick to
 * settle animated values. This is short enough to feel immediate.
 */
export const REDUCED_MOTION_DURATION_MS = 1;

/**
 * Collapse an animation duration when the user asked for reduced motion.
 * Keeps the branch in one place instead of at every `Animated.timing` call.
 */
export function motionDuration(preferred: number, reduced: boolean): number {
  return reduced ? REDUCED_MOTION_DURATION_MS : preferred;
}

/** True when the user has asked the OS to reduce motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;

    // `isReduceMotionEnabled` rejects on platforms without the native module
    // (and under some test environments). Treat any failure as "no preference
    // expressed" rather than letting it surface as an unhandled rejection.
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduced(value);
      })
      .catch(() => {
        if (active) setReduced(false);
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      if (active) setReduced(value);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

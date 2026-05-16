/**
 * ActivityTracker — invisible wrapper that resets the auto-lock
 * timer on ANY touch event within the subtree.
 *
 * Uses `onStartShouldSetResponderCapture` which fires on the capture
 * phase of every touch — before any scroll, press, or swipe handler.
 * Always returns `false` so it never steals the gesture from children.
 *
 * Usage:
 *   <ActivityTracker onActivity={resetActivity}>
 *     {children}
 *   </ActivityTracker>
 */

import type { ReactElement, ReactNode } from 'react';
import { View } from 'react-native';

export interface ActivityTrackerProps {
  /** Called on every touch — should reset the inactivity timer. */
  readonly onActivity: () => void;
  readonly children: ReactNode;
  readonly testID?: string;
}

export function ActivityTracker(props: ActivityTrackerProps): ReactElement {
  return (
    <View
      testID={props.testID}
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => {
        props.onActivity();
        return false;
      }}
    >
      {props.children}
    </View>
  );
}

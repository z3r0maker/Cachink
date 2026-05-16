/**
 * QuickSwitchScreen — user avatar grid for fast user switching.
 *
 * Sub-components extracted per CLAUDE.md §6 (200-line / 40-line caps):
 *   - QuickSwitchHeader → quick-switch-header.tsx
 *   - UserAvatar / UserAvatarGrid → user-avatar.tsx
 *   - login-animations.ts → fade, scale, slide hooks
 */

import { useState, type ReactElement } from 'react';
import { Animated } from 'react-native';
import { View } from '@tamagui/core';
import type { User, UserId } from '@cachink/domain';
import { FloatingCoinsBackground } from '../../components/index';
import { usePinSlideIn } from './login-animations';
import { PinPrompt } from './pin-prompt';
import { QuickSwitchHeader } from './quick-switch-header';
import { UserAvatarGrid } from './user-avatar';

export interface QuickSwitchScreenProps {
  readonly users: readonly User[];
  readonly onAuthenticate: (userId: UserId, pin: string) => void;
  readonly onForgotPin?: (userId: UserId) => void;
  readonly error: string | null;
  readonly submitting: boolean;
  readonly businessName?: string;
  readonly testID?: string;
}

function AnimatedPinPrompt(props: {
  readonly visible: boolean;
  readonly children: ReactElement;
}): ReactElement | null {
  const anim = usePinSlideIn(props.visible);
  if (!props.visible) return null;
  return (
    <Animated.View
      style={{
        transform: [{ translateY: anim.translateY }],
        opacity: anim.opacity,
        width: '100%',
        alignItems: 'center',
      }}
    >
      {props.children}
    </Animated.View>
  );
}

export function QuickSwitchScreen(props: QuickSwitchScreenProps): ReactElement {
  const [selectedUserId, setSelectedUserId] = useState<UserId | null>(null);
  const name = props.users.find((u) => u.id === selectedUserId)?.nombre ?? '';
  const forgotPin = props.onForgotPin;

  return (
    <FloatingCoinsBackground testID={props.testID ?? 'quick-switch'}>
      <View flex={1} alignItems="center" justifyContent="center" padding={24} gap={24}>
        <QuickSwitchHeader businessName={props.businessName} />
        <UserAvatarGrid users={props.users} selectedUserId={selectedUserId} onSelect={setSelectedUserId} />
        <AnimatedPinPrompt visible={selectedUserId !== null}>
          <PinPrompt
            userId={selectedUserId!}
            userName={name}
            onSubmit={(pin) => props.onAuthenticate(selectedUserId!, pin)}
            onForgotPin={forgotPin ? () => forgotPin(selectedUserId!) : undefined}
            error={props.error}
            submitting={props.submitting}
          />
        </AnimatedPinPrompt>
      </View>
    </FloatingCoinsBackground>
  );
}

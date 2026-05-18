/**
 * GlobalErrorToast — renders a stack of error toasts at the bottom of
 * the screen. Auto-dismisses after a few seconds. Tap to dismiss.
 *
 * Mount once inside AppProviders, as a sibling of the main content.
 */

import type { ReactElement } from 'react';
import { View, Text } from '@tamagui/core';
import { useErrorToastStore } from '../../observability/error-toast-store';

interface ToastItemProps {
  readonly toast: { id: string; severity: string; message: string; operation?: string };
  readonly onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps): ReactElement {
  const isError = toast.severity === 'error';
  return (
    <View
      onPress={() => onDismiss(toast.id)}
      backgroundColor={isError ? '$red3' : '$yellow3'}
      borderWidth={1}
      borderColor={isError ? '$red8' : '$yellow8'}
      borderRadius="$3"
      paddingHorizontal="$3"
      paddingVertical="$2.5"
      shadowColor="black"
      shadowOpacity={0.15}
      shadowRadius={6}
      pressStyle={{ opacity: 0.8 }}
      cursor="pointer"
      testID={`error-toast-${toast.id}`}
    >
      <View flexDirection="row" alignItems="center" gap="$2">
        <Text fontSize="$3">{isError ? '\u274C' : '\u26A0\uFE0F'}</Text>
        <Text
          flex={1}
          fontSize="$2"
          fontWeight="600"
          color={isError ? '$red11' : '$yellow11'}
          numberOfLines={2}
        >
          {toast.message}
        </Text>
      </View>
      {toast.operation && (
        <Text fontSize="$1" color="$colorSubtle" marginTop="$1" fontFamily="$mono">
          {toast.operation}
        </Text>
      )}
    </View>
  );
}

export function GlobalErrorToast(): ReactElement | null {
  const toasts = useErrorToastStore((s) => s.toasts);
  const dismiss = useErrorToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <View
      position="absolute"
      bottom={90}
      left={12}
      right={12}
      zIndex={9999}
      pointerEvents="box-none"
      gap="$2"
      testID="global-error-toast"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </View>
  );
}

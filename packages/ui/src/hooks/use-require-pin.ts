/**
 * useRequirePin — reusable PIN gate hook for destructive actions.
 *
 * Opens a PIN input overlay. Resolves with the entered PIN string
 * when the user submits, or null if they dismiss. The caller is
 * responsible for verifying the PIN (the use case does the bcrypt
 * comparison server-side).
 *
 * Reused for cancellations + future destructive actions.
 */

import { useCallback, useState } from 'react';

export interface PinGateState {
  /** Whether the PIN prompt is currently visible. */
  readonly isOpen: boolean;
  /** Open the PIN prompt. Returns a promise that resolves with the PIN or null. */
  readonly requestPin: () => Promise<string | null>;
  /** Called by the PIN input when user submits their PIN. */
  readonly submitPin: (pin: string) => void;
  /** Called when user dismisses the PIN prompt. */
  readonly dismiss: () => void;
}

export function useRequirePin(): PinGateState {
  const [isOpen, setIsOpen] = useState(false);
  const [resolver, setResolver] = useState<{
    resolve: (pin: string | null) => void;
  } | null>(null);

  const requestPin = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      setResolver({ resolve });
      setIsOpen(true);
    });
  }, []);

  const submitPin = useCallback(
    (pin: string) => {
      setIsOpen(false);
      resolver?.resolve(pin);
      setResolver(null);
    },
    [resolver],
  );

  const dismiss = useCallback(() => {
    setIsOpen(false);
    resolver?.resolve(null);
    setResolver(null);
  }, [resolver]);

  return { isOpen, requestPin, submitPin, dismiss };
}

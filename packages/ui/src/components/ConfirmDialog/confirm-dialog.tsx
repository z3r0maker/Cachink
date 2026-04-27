/**
 * `<ConfirmDialog>` — branded confirmation modal with a primary
 * destructive (or default) action and an inline pending state.
 *
 * Replaces the cross-platform-broken `globalThis.confirm()` per
 * Audit M-1 PR1: native React Native silently no-ops the global,
 * so any `if (confirm(…))` branch shipped behaviour that diverged
 * between web and mobile. The primitive composes the brand `<Modal>`
 * + brand `<Btn>` so the confirmation flow stays inside the design
 * system's hard-shadow tactile vocabulary on both platforms.
 *
 * Props:
 *   - `open` / `onClose` mirror `<Modal>`'s controlled API.
 *   - `onConfirm` may return a Promise; the primitive disables the
 *     confirm Btn while it's pending so users can't double-fire
 *     destructive actions during a slow round-trip (e.g. cliente
 *     deletion → repository → SQLite write).
 *   - `tone="danger"` swaps the primary Btn to the brand red variant
 *     (CLAUDE.md §8.4 `danger`) for delete / restablecer / wipe
 *     surfaces. Defaults to neutral `dark`.
 *   - `cancelLabel` defaults to the i18n `actions.cancel` ("Cancelar")
 *     so call sites only have to provide the affirmative copy
 *     ("Eliminar", "Restablecer", "Cerrar sesión").
 *
 * Accessibility (Audit Round 2 G1): the underlying `<Modal>` is a
 * `<Dialog>` — focus trap, ESC-to-close, and `role="dialog"` come
 * from `@tamagui/dialog` for free.
 */
import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn } from '../Btn';
import { Modal } from '../Modal';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void | Promise<void>;
  readonly title: string;
  readonly description?: string;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly tone?: 'default' | 'danger';
}

function Description({ children }: { children: string }): ReactElement {
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.medium}
      fontSize={14}
      color={colors.ink}
      marginBottom={16}
    >
      {children}
    </Text>
  );
}

function usePendingConfirm(onConfirm: ConfirmDialogProps['onConfirm']): {
  pending: boolean;
  handleConfirm: () => Promise<void>;
} {
  const [pending, setPending] = useState(false);

  const handleConfirm = async (): Promise<void> => {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  };

  return { pending, handleConfirm };
}

function ActionButtons(props: {
  confirmLabel: string;
  cancelLabel: string;
  tone: NonNullable<ConfirmDialogProps['tone']>;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}): ReactElement {
  const confirmVariant = props.tone === 'danger' ? 'danger' : 'primary';

  return (
    <View gap={8}>
      <Btn
        variant={confirmVariant}
        onPress={() => {
          void props.onConfirm();
        }}
        disabled={props.pending}
        fullWidth
        testID="confirm-dialog-confirm"
      >
        {props.confirmLabel}
      </Btn>
      <Btn
        variant="outline"
        onPress={props.onClose}
        disabled={props.pending}
        fullWidth
        testID="confirm-dialog-cancel"
      >
        {props.cancelLabel}
      </Btn>
    </View>
  );
}

export function ConfirmDialog(props: ConfirmDialogProps): ReactElement {
  const { t } = useTranslation();
  const { pending, handleConfirm } = usePendingConfirm(props.onConfirm);
  const cancelLabel = props.cancelLabel ?? t('actions.cancel');
  const tone = props.tone ?? 'default';

  return (
    <Modal open={props.open} onClose={props.onClose} title={props.title} testID="confirm-dialog">
      {props.description ? <Description>{props.description}</Description> : null}
      <ActionButtons
        confirmLabel={props.confirmLabel}
        cancelLabel={cancelLabel}
        tone={tone}
        pending={pending}
        onClose={props.onClose}
        onConfirm={handleConfirm}
      />
    </Modal>
  );
}

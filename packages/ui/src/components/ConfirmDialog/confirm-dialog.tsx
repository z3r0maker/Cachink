/**
 * `<ConfirmDialog>` — branded confirmation modal with a primary
 * destructive (or default) action and an inline pending state.
 *
 * Replaces the cross-platform-broken `globalThis.confirm()` per
 * Audit M-1 PR1: native React Native silently no-ops the global,
 * so any `if (confirm(…))` branch shipped behaviour that diverged
 * between web and mobile. Since Track M (M-05) it is El Mostrador's
 * centred `<Dialog>` (§4: confirmations are dialogs, not sheets) with
 * the §3 buttons: the confirm, then a secondary «Cancelar».
 *
 * Props:
 *   - `open` / `onClose` mirror `<Modal>`'s controlled API.
 *   - `onConfirm` may return a Promise; the primitive disables the
 *     confirm Btn while it's pending so users can't double-fire
 *     destructive actions during a slow round-trip (e.g. cliente
 *     deletion → repository → SQLite write).
 *   - `tone="danger"` makes the confirm the filled destructive button
 *     (`destructiveFilled`) for delete / restablecer / wipe surfaces;
 *     otherwise it is the yellow primary.
 *   - `cancelLabel` defaults to the i18n `actions.cancel` ("Cancelar")
 *     so call sites only have to provide the affirmative copy
 *     ("Eliminar", "Restablecer", "Cerrar sesión").
 *
 * Accessibility (Audit Round 2 G1): `<Dialog>` sits on `@tamagui/dialog`,
 * so the focus trap, Escape and `role="dialog"` come for free.
 */
import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn } from '../Btn';
import { Dialog } from '../Dialog';
import { useTranslation } from '../../i18n/index';
import { colors, portalFontSizes, typography } from '../../theme';
import { notificationSuccess } from '../../haptics/index';

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
      fontWeight={typography.weights.semibold}
      fontSize={portalFontSizes.body}
      lineHeight={21}
      color={colors.ink}
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
    notificationSuccess();
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
  const confirmVariant = props.tone === 'danger' ? 'destructiveFilled' : 'primary';

  return (
    <View gap={8}>
      <Btn
        variant={confirmVariant}
        onPress={() => {
          void props.onConfirm();
        }}
        disabled={props.pending}
        fullWidth
        size="lg"
        sentence
        testID="confirm-dialog-confirm"
      >
        {props.confirmLabel}
      </Btn>
      <Btn
        variant="secondary"
        onPress={props.onClose}
        disabled={props.pending}
        fullWidth
        size="lg"
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
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={props.title}
      testID="confirm-dialog"
      footer={
        <ActionButtons
          confirmLabel={props.confirmLabel}
          cancelLabel={cancelLabel}
          tone={tone}
          pending={pending}
          onClose={props.onClose}
          onConfirm={handleConfirm}
        />
      }
    >
      {props.description ? <Description>{props.description}</Description> : null}
    </Dialog>
  );
}

/**
 * Dialog — El Mostrador's centred confirmation (§4; the caja's
 * `DialogoMostrador`): the scrim, then a 342 px white card with the thick
 * black edge, radius 22 and the hero shadow. It pops from 0.94 in 220 ms and
 * only fades under Reduce Motion.
 *
 * Confirmations are dialogs; details and forms are bottom sheets. The footer
 * holds the choice, usually a quiet «Volver» beside the confirm.
 */
import type { ReactElement, ReactNode } from 'react';
import { Animated } from 'react-native';
import { Dialog as TamaguiDialog } from '@tamagui/dialog';
import { View } from '@tamagui/core';
import { borderWidths, colors, radii, shadows } from '../../theme';
import { useTranslation } from '../../i18n/index';
import { useEnterMotion } from '../motion/use-enter-motion';
import { OverlayHead, PINNED, Scrim } from '../Overlay/overlay-parts';

/** The boards' dialog width on a 390 px phone (16 px either side, plus air). */
const DIALOG_WIDTH = 342;

export interface DialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly eyebrow?: string;
  readonly children?: ReactNode;
  readonly footer?: ReactNode;
  readonly closeLabel?: string;
  readonly testID?: string;
}

function Card(props: DialogProps & { readonly id: string }): ReactElement {
  const { t } = useTranslation();
  const motion = useEnterMotion('pop');
  return (
    <Animated.View
      pointerEvents="auto"
      style={[
        {
          width: DIALOG_WIDTH,
          maxWidth: '100%',
          backgroundColor: colors.white,
          borderWidth: borderWidths.thick,
          borderColor: colors.black,
          borderRadius: radii[7],
          boxShadow: shadows.hero,
          padding: 18,
          gap: 14,
        },
        motion,
      ]}
    >
      <OverlayHead
        eyebrow={props.eyebrow}
        title={props.title}
        onClose={props.onClose}
        closeLabel={props.closeLabel ?? t('shell.cerrar')}
        testID={props.id}
        strongClose
      />
      {props.children}
      {props.footer ? <View gap={10}>{props.footer}</View> : null}
    </Animated.View>
  );
}

export function Dialog(props: DialogProps): ReactElement {
  const id = props.testID ?? 'dialog';
  return (
    <TamaguiDialog
      modal
      open={props.open}
      onOpenChange={(next) => (next ? undefined : props.onClose())}
    >
      <TamaguiDialog.Portal>
        <Scrim onPress={props.onClose} testID={`${id}-scrim`} />
        <TamaguiDialog.Content
          key="dialog"
          unstyled
          testID={id}
          position={PINNED}
          top={0}
          right={0}
          bottom={0}
          left={0}
          padding={16}
          alignItems="center"
          justifyContent="center"
          backgroundColor="transparent"
          pointerEvents="box-none"
        >
          <Card {...props} id={id} />
        </TamaguiDialog.Content>
      </TamaguiDialog.Portal>
    </TamaguiDialog>
  );
}

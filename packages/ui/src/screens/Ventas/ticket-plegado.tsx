/**
 * The portrait tablet's ticket folded to one row (TbCobrarVertical): the
 * folio and pieces (tap to unfold), the total and «Cobrar».
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { Btn } from '../../components/Btn/index';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import { colors } from '../../theme';
import { piezasTexto, resumenTicket } from './ticket-en-curso';
import type { TicketPanelProps } from './ticket-panel';

/** «Ticket · V-0413». */
export const titulo = (folio: string | null): string =>
  ['Ticket', folio].filter(Boolean).join(' · ');

export function Plegado(p: TicketPanelProps & { readonly onAbrir: () => void }): ReactElement {
  const { piezas, total } = resumenTicket(p.lines);
  return (
    <View flexDirection="row" alignItems="center" gap={12} padding={12}>
      <Pressable
        role="button"
        aria-label="Mostrar el ticket"
        aria-expanded={false}
        onPress={p.onAbrir}
        style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}
      >
        <Eyebrow>{titulo(p.folio)}</Eyebrow>
        <MText size="md" weight="bold" color={colors.gray600}>
          {piezas > 0 ? piezasTexto(piezas) : 'Toca un producto para empezar'}
        </MText>
      </Pressable>
      <MText size="xl3" weight="extraBold" aria-live="polite">
        {formatMoney(total)}
      </MText>
      <Btn
        variant="primary"
        size="lg"
        sentence
        disabled={piezas === 0}
        onPress={p.onCobrar}
        testID="ticket-cobrar"
      >
        Cobrar
      </Btn>
    </View>
  );
}

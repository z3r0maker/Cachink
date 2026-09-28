/**
 * «Revisa el ticket» (MvTicket): the bottom sheet the bar's «Cobrar» opens.
 * The lines with their steppers, the total, and «Cobrar $X», which goes on to
 * the cobro; «Vaciar ticket» starts over. Closing keeps the ticket.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import type { LineaTicket } from '@xangarro/caja/caja';
import { BottomSheet } from '../../components/BottomSheet/index';
import { Btn } from '../../components/Btn/index';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import type { ProductoCobrar } from './cobrar-catalogo';
import { TicketLineas, TicketVacio } from './ticket-lineas';
import { piezasTexto, resumenTicket } from './ticket-en-curso';

export interface TicketSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly lines: readonly LineaTicket[];
  readonly info: ReadonlyMap<string, ProductoCobrar>;
  /** «V-0413», the folio this sale will take; null while it loads. */
  readonly folio: string | null;
  readonly onBump: (productoId: string, delta: number) => void;
  readonly onQuitar: (productoId: string) => void;
  readonly onVaciar: () => void;
  readonly onCobrar: () => void;
}

function Pie(p: TicketSheetProps): ReactElement {
  const { piezas, total } = resumenTicket(p.lines);
  const monto = formatMoney(total);
  return (
    <View gap={12}>
      <View flexDirection="row" alignItems="baseline" justifyContent="space-between">
        <Eyebrow>Total</Eyebrow>
        <MText size="xl5" weight="extraBold" testID="ticket-total">
          {monto}
        </MText>
      </View>
      {piezas > 0 ? (
        <View flexDirection="row" gap={10}>
          <Btn variant="secondary" size="xl" onPress={p.onVaciar} testID="ticket-vaciar">
            Vaciar ticket
          </Btn>
          <View flex={1}>
            <Btn
              variant="primary"
              size="xl"
              sentence
              fullWidth
              onPress={p.onCobrar}
              testID="ticket-cobrar"
            >
              {`Cobrar ${monto}`}
            </Btn>
          </View>
        </View>
      ) : (
        <Btn variant="primary" size="xl" sentence fullWidth disabled testID="ticket-cobrar">
          Cobrar
        </Btn>
      )}
    </View>
  );
}

export function TicketSheet(p: TicketSheetProps): ReactElement {
  const { piezas } = resumenTicket(p.lines);
  const eyebrow = ['Ticket', p.folio, piezasTexto(piezas)].filter(Boolean).join(' · ');
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onClose}
      eyebrow={eyebrow}
      title="Revisa el ticket"
      closeLabel="Cerrar y seguir agregando"
      testID="ticket-sheet"
      footer={<Pie {...p} />}
    >
      {p.lines.length === 0 ? (
        <TicketVacio texto="Cierra esta hoja y toca un producto para empezar la venta." />
      ) : (
        <TicketLineas lines={p.lines} info={p.info} onBump={p.onBump} onQuitar={p.onQuitar} />
      )}
    </BottomSheet>
  );
}

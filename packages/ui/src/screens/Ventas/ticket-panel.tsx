/**
 * The tablet's ticket (TbCobrar, TbCobrarVertical): beside the catalogue in
 * landscape, docked under it in portrait (it folds to one row). The lines,
 * «Ponerle nombre de cliente (para fiado)», the total, the four methods as
 * chips and «Cobrar $X · método», as the web caja's side panel has them.
 */
import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import type { LineaTicket } from '@xangarro/caja/caja';
import { Btn } from '../../components/Btn/index';
import { Chip } from '../../components/Chip/index';
import { Eyebrow } from '../../components/Panel/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderColors, borderWidths, colors } from '../../theme';
import type { MetodoCobro } from '../Checkout/cobro-logic';
import type { ProductoCobrar } from './cobrar-catalogo';
import { COBRAR_GLYPHS } from './cobrar-glyphs';
import { TicketLineas, TicketVacio } from './ticket-lineas';
import { Plegado, titulo } from './ticket-plegado';
import { piezasTexto, resumenTicket } from './ticket-en-curso';

export interface TicketPanelProps {
  readonly modo: 'lado' | 'dock';
  readonly lines: readonly LineaTicket[];
  readonly info: ReadonlyMap<string, ProductoCobrar>;
  readonly folio: string | null;
  readonly metodos: readonly MetodoCobro[];
  readonly metodo: MetodoCobro;
  readonly onMetodo: (m: MetodoCobro) => void;
  readonly onBump: (productoId: string, delta: number) => void;
  readonly onQuitar: (productoId: string) => void;
  readonly onVaciar: () => void;
  readonly onCobrar: () => void;
  readonly onFiado: () => void;
}

function Cabeza(p: TicketPanelProps & { readonly onPlegar?: () => void }): ReactElement {
  const { piezas } = resumenTicket(p.lines);
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      paddingHorizontal={16}
      paddingVertical={8}
    >
      {p.onPlegar ? (
        <Btn
          variant="quiet"
          size="md"
          icon={<PathIcon d={COBRAR_GLYPHS.abajo} size={18} />}
          ariaLabel="Ocultar el ticket"
          onPress={p.onPlegar}
        />
      ) : null}
      <View flex={1} flexDirection="row" alignItems="baseline" gap={8}>
        <Eyebrow>{titulo(p.folio)}</Eyebrow>
        <MText size="sm" weight="bold" color={colors.gray600}>
          {piezasTexto(piezas)}
        </MText>
      </View>
      <Btn
        variant="quiet"
        size="md"
        onPress={p.onVaciar}
        disabled={piezas === 0}
        testID="ticket-vaciar"
      >
        Vaciar
      </Btn>
    </View>
  );
}

function Metodos(p: TicketPanelProps): ReactElement {
  return (
    <View role="radiogroup" aria-label="Cómo paga" flexDirection="row" flexWrap="wrap" gap={8}>
      {p.metodos.map((m) => (
        <Chip
          key={m}
          label={m}
          selected={p.metodo === m}
          onPress={() => p.onMetodo(m)}
          testID={`ticket-metodo-${m}`}
        />
      ))}
    </View>
  );
}

function FiadoBoton(p: { onPress: () => void; disabled: boolean }): ReactElement {
  return (
    <Btn
      variant="quiet"
      size="md"
      fullWidth
      icon={<PathIcon d={COBRAR_GLYPHS.fiado} size={18} />}
      onPress={p.onPress}
      disabled={p.disabled}
      testID="ticket-fiado"
    >
      Ponerle nombre de cliente (para fiado)
    </Btn>
  );
}

function Pie(p: TicketPanelProps): ReactElement {
  const { piezas, total } = resumenTicket(p.lines);
  const vacio = piezas === 0;
  return (
    <View
      gap={10}
      padding={16}
      borderTopWidth={borderWidths.quiet}
      borderTopColor={borderColors.quiet}
    >
      <FiadoBoton onPress={p.onFiado} disabled={vacio} />
      <View flexDirection="row" alignItems="baseline" justifyContent="space-between">
        <Eyebrow>Total</Eyebrow>
        <MText size="xl5" weight="extraBold" testID="ticket-total">
          {formatMoney(total)}
        </MText>
      </View>
      <Metodos {...p} />
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        disabled={vacio}
        onPress={p.onCobrar}
        testID="ticket-cobrar"
      >
        {`Cobrar ${formatMoney(total)} · ${p.metodo}`}
      </Btn>
    </View>
  );
}

function Cuerpo(p: TicketPanelProps & { readonly onPlegar?: () => void }): ReactElement {
  const texto = `Toca un producto de ${p.modo === 'lado' ? 'la izquierda' : 'arriba'} para empezar la venta.`;
  return (
    <>
      <Cabeza {...p} />
      <ScrollView
        style={{ flexShrink: 1, flexGrow: p.modo === 'lado' ? 1 : 0 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {p.lines.length === 0 ? (
          <TicketVacio texto={texto} />
        ) : (
          <TicketLineas
            compacta
            lines={p.lines}
            info={p.info}
            onBump={p.onBump}
            onQuitar={p.onQuitar}
          />
        )}
      </ScrollView>
      <Pie {...p} />
    </>
  );
}

export function TicketPanel(p: TicketPanelProps): ReactElement {
  const [abierto, setAbierto] = useState(true);
  const lado = p.modo === 'lado';
  return (
    <View
      testID="ticket-panel"
      role="region"
      aria-label="Ticket"
      backgroundColor={colors.white}
      borderColor={colors.black}
      borderLeftWidth={lado ? borderWidths.thin : 0}
      borderTopWidth={lado ? 0 : borderWidths.thin}
      width={lado ? 380 : undefined}
      maxHeight={lado ? undefined : '55%'}
      flexShrink={0}
    >
      {lado || abierto ? (
        <Cuerpo {...p} onPlegar={lado ? undefined : () => setAbierto(false)} />
      ) : (
        <Plegado {...p} onAbrir={() => setAbierto(true)} />
      )}
    </View>
  );
}

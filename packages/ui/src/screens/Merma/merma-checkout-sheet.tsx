/**
 * MermaCheckoutSheet — batch merma checkout with reason selection.
 *
 * A batch reason applies to all items by default. Per-item override
 * is available via "Cambiar razón" links on each row.
 */
import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { Btn, Modal, TextField } from '../../components/index';
import { OptionCardGroup, type OptionCardItem } from '../../components/OptionCardGroup/index';
import { colors, typography } from '../../theme';
import type { CartItem } from '../../hooks/use-cart';
import { CheckoutSummary } from '../Ventas/checkout-summary';

// ---------------------------------------------------------------------------
// Merma reason options
// ---------------------------------------------------------------------------

const MERMA_REASONS: readonly OptionCardItem[] = [
  { key: 'Preparación incorrecta', icon: 'utensils', label: 'Preparación incorrecta', description: 'Error en cocina o preparación' },
  { key: 'Caducidad', icon: 'calendar', label: 'Caducidad', description: 'Producto vencido o echado a perder' },
  { key: 'Daño', icon: 'circle-alert', label: 'Daño', description: 'Producto dañado o roto' },
  { key: 'Otro', icon: 'clipboard-list', label: 'Otro', description: 'Otra razón de pérdida' },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MermaCheckoutSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly items: readonly CartItem[];
  readonly onSubmit: (reason: string, nota: string | null) => void;
  readonly submitting?: boolean;
  readonly error?: Error | null;
  readonly testID?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function MermaFormBody(props: {
  items: readonly CartItem[];
  reason: string;
  onReasonChange: (v: string) => void;
  nota: string;
  onNotaChange: (v: string) => void;
  error?: Error | null;
}): ReactElement {
  return (
    <View gap={16}>
      <CheckoutSummary items={props.items} />
      <OptionCardGroup
        label="Razón para todos"
        value={props.reason}
        onChange={props.onReasonChange}
        options={MERMA_REASONS}
        layout="grid"
        testID="merma-reason-group"
      />
      <TextField
        value={props.nota}
        onChange={props.onNotaChange}
        label="Nota (opcional)"
        placeholder="Detalle adicional..."
        testID="merma-nota"
      />
      {props.error != null && (
        <Text fontFamily={typography.fontFamily} fontSize={12} color={colors.red} textAlign="center">
          {props.error.message}
        </Text>
      )}
    </View>
  );
}

export function MermaCheckoutSheet(props: MermaCheckoutSheetProps): ReactElement {
  const [reason, setReason] = useState('Preparación incorrecta');
  const [nota, setNota] = useState('');

  return (
    <Modal open={props.open} onClose={props.onClose} title="Registrar merma" testID={props.testID ?? 'merma-checkout-sheet'}>
      <ScrollView style={{ maxHeight: 480 }}>
        <MermaFormBody items={props.items} reason={reason} onReasonChange={setReason} nota={nota} onNotaChange={setNota} error={props.error} />
        <Btn variant="danger" fullWidth size="lg" onPress={() => props.onSubmit(reason, nota.trim() || null)} disabled={props.items.length === 0} loading={props.submitting === true} testID="merma-checkout-submit">
          Registrar merma
        </Btn>
      </ScrollView>
    </Modal>
  );
}

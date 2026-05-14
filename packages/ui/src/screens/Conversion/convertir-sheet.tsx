/**
 * ConvertirSheet — bottom sheet to execute a conversion recipe.
 * Phase 18.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { ConversionReceta, Product } from '@cachink/domain';
import { Btn, Modal } from '../../components/index';
import { IntegerField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';

export interface ConvertirSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly receta: ConversionReceta | null;
  readonly products: ReadonlyMap<string, Product>;
  readonly stockMap: ReadonlyMap<string, number>;
  readonly onConfirm: (multiplicador: number) => void;
  readonly submitting?: boolean;
  readonly testID?: string;
}

export function ConvertirSheet(props: ConvertirSheetProps): ReactElement {
  const { t } = useTranslation();
  const [mult, setMult] = useState('1');
  const multN = Math.max(1, Number(mult) || 1);

  const mp = props.receta ? props.products.get(props.receta.materiaPrimaId as string) : null;
  const prod = props.receta ? props.products.get(props.receta.productoResultanteId as string) : null;
  const mpStock = mp ? (props.stockMap.get(mp.id as string) ?? 0) : 0;
  const needed = props.receta ? props.receta.cantidadOrigen * multN : 0;
  const insufficient = needed > mpStock;
  const cantResultante = props.receta ? props.receta.cantidadResultante * multN : 0;

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('conversion.convertirTitle')}
      testID={props.testID ?? 'convertir-sheet'}
    >
      {props.receta && (
        <View gap={12}>
          <IntegerField
            label={t('conversion.multiplicadorLabel')}
            value={mult}
            onChange={setMult}
            min={1}
            testID="convertir-multiplicador"
          />
          <Text fontSize={14} color="$color">
            {t('conversion.previewSalida', {
              cantidad: String(needed),
              unidad: mp?.unidad ?? '',
              nombre: mp?.nombre ?? '—',
            })}
          </Text>
          <Text fontSize={14} color="$color">
            {t('conversion.previewEntrada', {
              cantidad: String(cantResultante),
              unidad: prod?.unidad ?? '',
              nombre: prod?.nombre ?? '—',
            })}
          </Text>
          {insufficient && (
            <Text fontSize={13} color="$colorDanger" testID="convertir-error-stock">
              {t('conversion.stockInsuficiente', { stock: String(mpStock) })}
            </Text>
          )}
          <Btn
            variant="primary"
            onPress={() => props.onConfirm(multN)}
            disabled={insufficient || props.submitting === true}
            fullWidth
            testID="convertir-confirm"
          >
            {t('conversion.confirmar')}
          </Btn>
        </View>
      )}
    </Modal>
  );
}

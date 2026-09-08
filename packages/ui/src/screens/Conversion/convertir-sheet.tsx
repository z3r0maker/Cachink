/**
 * ConvertirSheet — bottom sheet to execute a conversion recipe.
 * Phase 18.
 */

import { useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { ConversionReceta, Product } from '@cachink/domain';
import { Btn, Modal } from '../../components/index';
import { WheelQuantityPicker } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes } from '../../theme';

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

interface ConvertirCalc {
  mp: Product | undefined;
  prod: Product | undefined;
  mpStock: number;
  needed: number;
  insufficient: boolean;
  cantResultante: number;
}

function computeConvertir(
  receta: ConversionReceta | null,
  products: ReadonlyMap<string, Product>,
  stockMap: ReadonlyMap<string, number>,
  multN: number,
): ConvertirCalc {
  const mp = receta ? products.get(receta.materiaPrimaId as string) : undefined;
  const prod = receta ? products.get(receta.productoResultanteId as string) : undefined;
  const mpStock = mp ? (stockMap.get(mp.id as string) ?? 0) : 0;
  const needed = receta ? receta.cantidadOrigen * multN : 0;
  return {
    mp,
    prod,
    mpStock,
    needed,
    insufficient: needed > mpStock,
    cantResultante: receta ? receta.cantidadResultante * multN : 0,
  };
}

function ConvertirPreview({
  calc,
  t,
}: {
  calc: ConvertirCalc;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <>
      <Text fontSize={fontSizes.md} color={colors.black}>
        {t('conversion.previewSalida', {
          cantidad: String(calc.needed),
          unidad: calc.mp?.unidad ?? '',
          nombre: calc.mp?.nombre ?? '—',
        })}
      </Text>
      <Text fontSize={fontSizes.md} color={colors.black}>
        {t('conversion.previewEntrada', {
          cantidad: String(calc.cantResultante),
          unidad: calc.prod?.unidad ?? '',
          nombre: calc.prod?.nombre ?? '—',
        })}
      </Text>
      {calc.insufficient && (
        <Text fontSize={fontSizes.sm} color={colors.redText} testID="convertir-error-stock">
          {t('conversion.stockInsuficiente', { stock: String(calc.mpStock) })}
        </Text>
      )}
    </>
  );
}

export function ConvertirSheet(props: ConvertirSheetProps): ReactElement {
  const { t } = useTranslation();
  const [mult, setMult] = useState(1);
  const multN = Math.max(1, mult);
  const calc = computeConvertir(props.receta, props.products, props.stockMap, multN);

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('conversion.convertirTitle')}
      testID={props.testID ?? 'convertir-sheet'}
    >
      {props.receta && (
        <View gap={12}>
          <WheelQuantityPicker
            label={t('conversion.multiplicadorLabel')}
            value={mult}
            onChange={setMult}
            min={1}
            max={50}
            testID="convertir-multiplicador"
          />
          <ConvertirPreview calc={calc} t={t} />
          <Btn
            variant="primary"
            onPress={() => props.onConfirm(multN)}
            disabled={calc.insufficient || props.submitting === true}
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

/**
 * IsrDefaultsCard — Settings card that lets the user edit the default
 * ISR rate per régimen fiscal. Rates are stored in AppConfig and read
 * by the BusinessForm when the user changes regime.
 */

import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { REGIMENES_FISCALES, type IsrDefaults, type RegimenFiscal } from '@cachink/domain';
import { Btn, Card, Input, SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { useIsrDefaults, useUpdateIsrDefaults } from '../../hooks/use-isr-defaults';

/** Convert a decimal rate (0–1) to a display-friendly percentage string. */
function rateToDisplay(rate: number): string {
  return String(Math.round(rate * 10_000) / 100);
}

/** Convert a user-typed percentage string (0–100) back to a decimal rate. */
function displayToRate(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n / 100;
}

function IsrRateRow({
  regimen,
  value,
  onChange,
}: {
  regimen: RegimenFiscal;
  value: string;
  onChange: (v: string) => void;
}): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      gap={12}
      paddingVertical={4}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={14}
        color={colors.black}
        flex={1}
      >
        {regimen}
      </Text>
      <View flexDirection="row" alignItems="center" gap={4} width={100}>
        <Input type="decimal" value={value} onChange={onChange} testID={`isr-default-${regimen}`} />
        <Text fontFamily={typography.fontFamily} fontSize={14} color={colors.gray600}>
          %
        </Text>
      </View>
    </View>
  );
}

function useIsrFormState(data: IsrDefaults) {
  const [fields, setFields] = useState<Record<RegimenFiscal, string>>(() => {
    const init = {} as Record<RegimenFiscal, string>;
    for (const r of REGIMENES_FISCALES) init[r] = rateToDisplay(data[r] ?? 0);
    return init;
  });
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    const next = {} as Record<RegimenFiscal, string>;
    for (const r of REGIMENES_FISCALES) next[r] = rateToDisplay(data[r] ?? 0);
    setFields(next);
    setDirty(false);
  }, [data]);
  const handleChange = useCallback((regimen: RegimenFiscal, value: string) => {
    setFields((prev) => ({ ...prev, [regimen]: value }));
    setDirty(true);
  }, []);
  return { fields, dirty, handleChange };
}

interface IsrDefaultsFormProps {
  readonly data: IsrDefaults;
  readonly onSave: (next: IsrDefaults) => void;
  readonly saving: boolean;
}

function IsrDefaultsForm(props: IsrDefaultsFormProps): ReactElement {
  const { data, onSave, saving } = props;
  const { t } = useTranslation();
  const { fields, dirty, handleChange } = useIsrFormState(data);
  const handleSave = useCallback(() => {
    const next = {} as Record<string, number>;
    for (const r of REGIMENES_FISCALES) {
      const rate = displayToRate(fields[r] ?? '0');
      if (rate === null) return;
      next[r] = rate;
    }
    onSave(next as IsrDefaults);
  }, [fields, onSave]);
  return (
    <>
      {REGIMENES_FISCALES.map((r) => (
        <IsrRateRow
          key={r}
          regimen={r}
          value={fields[r] ?? '0'}
          onChange={(v) => handleChange(r, v)}
        />
      ))}
      <View marginTop={12}>
        <Btn
          variant="primary"
          onPress={handleSave}
          disabled={!dirty || saving}
          fullWidth
          testID="isr-defaults-save"
        >
          {t('settings.isrDefaultsSave')}
        </Btn>
      </View>
    </>
  );
}

export function IsrDefaultsCard(): ReactElement | null {
  const { t } = useTranslation();
  const { data } = useIsrDefaults();
  const mutation = useUpdateIsrDefaults();

  if (!data) return null;

  return (
    <Card testID="isr-defaults-card" padding="md" fullWidth>
      <SectionTitle title={t('settings.isrDefaultsTitle')} />
      <IsrDefaultsForm data={data} onSave={mutation.mutate} saving={mutation.isPending} />
      <Text fontFamily={typography.fontFamily} fontSize={12} color={colors.gray600} marginTop={8}>
        ℹ️ {t('settings.isrDefaultsHint')}
      </Text>
    </Card>
  );
}

/**
 * SettingsIndicadores — sub-screen for configuring financial health
 * thresholds per metric. Follows the same layout as SettingsTasasIsr.
 *
 * Six metrics, each with "Saludable" and "Alerta" numeric fields.
 * diasPromedioCobranza is inverted (lower = healthier): "≤" labels.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { HealthThresholds } from '@cachink/domain';
import { DEFAULT_HEALTH_THRESHOLDS } from '@cachink/domain';
import { Btn, Card, SectionTitle } from '../../components/index';
import { colors, typography } from '../../theme';
import { useHealthThresholds, useUpdateHealthThresholds } from '../../hooks/use-health-thresholds';

export interface SettingsIndicadoresProps {
  readonly testID?: string;
}

type MetricKey = keyof HealthThresholds;

interface MetricConfig {
  key: MetricKey;
  label: string;
  suffix: string;
  inverted: boolean;
}

const METRICS: MetricConfig[] = [
  { key: 'margenBruto', label: 'Margen Bruto', suffix: '%', inverted: false },
  { key: 'margenOperativo', label: 'Margen Operativo', suffix: '%', inverted: false },
  { key: 'margenNeto', label: 'Margen Neto', suffix: '%', inverted: false },
  { key: 'razonDeLiquidez', label: 'Razón de Liquidez', suffix: '×', inverted: false },
  { key: 'rotacionInventario', label: 'Rotación de Inventario', suffix: '×', inverted: false },
  { key: 'diasPromedioCobranza', label: 'Días Promedio Cobranza', suffix: ' días', inverted: true },
];

function toDisplay(val: number, isPercent: boolean): string {
  return isPercent ? String(Math.round(val * 100)) : String(val);
}

function fromDisplay(raw: string, isPercent: boolean): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return isPercent ? n / 100 : n;
}

function isPercent(m: MetricConfig): boolean {
  return m.suffix === '%';
}

function MetricLabel({ label }: { label: string }): ReactElement {
  return (
    <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold} fontSize={15} color={colors.black}>
      {label}
    </Text>
  );
}

export function SettingsIndicadores(
  props: SettingsIndicadoresProps,
): ReactElement {
  const thresholdsQ = useHealthThresholds();
  const update = useUpdateHealthThresholds();
  const initial = thresholdsQ.data ?? DEFAULT_HEALTH_THRESHOLDS;

  const [draft, setDraft] = useState<HealthThresholds>(initial);
  const [dirty, setDirty] = useState(false);

  const patchMetric = (key: MetricKey, field: 'healthy' | 'warning', raw: string): void => {
    const cfg = METRICS.find((m) => m.key === key)!;
    const val = fromDisplay(raw, isPercent(cfg));
    setDraft((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: val },
    }));
    setDirty(true);
  };

  const handleSave = (): void => {
    update.mutate(draft, { onSuccess: () => setDirty(false) });
  };

  return (
    <ScrollView
      testID={props.testID ?? 'settings-indicadores-screen'}
      style={{ flex: 1, backgroundColor: colors.offwhite }}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 24 }}
    >
      <SectionTitle title="Umbrales de salud" />

      {METRICS.map((m) => {
        const th = draft[m.key];
        const pct = isPercent(m);
        const op = m.inverted ? '≤' : '≥';
        return (
          <Card key={m.key} padding="md" fullWidth testID={`threshold-${m.key}`}>
            <MetricLabel label={m.label} />
            <ThresholdRow label={`Saludable ${op}`} value={toDisplay(th.healthy, pct)} suffix={m.suffix} onChange={(v) => patchMetric(m.key, 'healthy', v)} testID={`${m.key}-healthy`} />
            <ThresholdRow label={`Alerta ${op}`} value={toDisplay(th.warning, pct)} suffix={m.suffix} onChange={(v) => patchMetric(m.key, 'warning', v)} testID={`${m.key}-warning`} />
          </Card>
        );
      })}

      <Btn variant="primary" onPress={handleSave} disabled={!dirty || update.isPending} fullWidth testID="indicadores-save">
        Guardar
      </Btn>

      <Text fontFamily={typography.fontFamily} fontSize={12} color={colors.gray600} textAlign="center">
        Estos umbrales definen cuándo un indicador se marca como saludable, en alerta, o crítico.
      </Text>
    </ScrollView>
  );
}

function ThresholdRow(props: {
  label: string;
  value: string;
  suffix: string;
  onChange: (v: string) => void;
  testID: string;
}): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={8} marginTop={8}>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.medium} fontSize={14} color={colors.gray600} flex={1}>
        {props.label}
      </Text>
      <View flexDirection="row" alignItems="center" gap={4}>
        <View
          backgroundColor={colors.white}
          borderWidth={2}
          borderColor={colors.black}
          borderRadius={8}
          paddingHorizontal={12}
          paddingVertical={6}
          width={72}
        >
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={16}
            color={colors.black}
            textAlign="center"
            testID={props.testID}
          >
            {props.value}
          </Text>
        </View>
        <Text fontFamily={typography.fontFamily} fontSize={13} color={colors.gray600}>
          {props.suffix}
        </Text>
      </View>
    </View>
  );
}

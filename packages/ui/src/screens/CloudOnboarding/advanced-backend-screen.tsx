/**
 * AdvancedBackendScreen — Settings → Avanzado (P1E-M3 C11).
 *
 * Power users who want their own backend enter project URL + anon key
 * here. The form explicitly rejects PATs / service-role keys in both its
 * label copy and a validator — ADR-035 mandates that management-tier
 * credentials never enter the shipped app.
 *
 * On save, the owning route persists `{projectUrl, anonKey, powersyncUrl?}`
 * to `__cachink_sync_state` and forces a sign-out to avoid JWT/tenant
 * mismatch.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card, SectionTitle, Tag } from '../../components/index';
import { TextField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import type { CloudBackendConfig } from '../../sync/cloud-bridge';
import { useAdvancedSave, useAdvancedState, type AdvancedState } from './advanced-backend-state';

export interface AdvancedBackendScreenProps {
  readonly existing: CloudBackendConfig | null;
  readonly onSave: (config: CloudBackendConfig) => Promise<void>;
  readonly onClear: () => Promise<void>;
  readonly onCancel: () => void;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

interface FieldsCommonProps {
  readonly t: T;
  readonly state: AdvancedState;
  readonly patch: (next: Partial<AdvancedState>) => void;
}

function ProjectUrlField({ t, state, patch }: FieldsCommonProps): ReactElement {
  return (
    <TextField
      label={t('advancedBackend.projectUrl')}
      value={state.projectUrl}
      onChange={(v) => patch({ projectUrl: v })}
      placeholder="https://proyecto.supabase.co"
      testID="advanced-url-input"
      returnKeyType="next"
    />
  );
}

function AnonKeyField({ t, state, patch }: FieldsCommonProps): ReactElement {
  return (
    <View marginTop={12}>
      <TextField
        label={t('advancedBackend.anonKey')}
        value={state.anonKey}
        onChange={(v) => patch({ anonKey: v })}
        placeholder="eyJ…"
        testID="advanced-anon-input"
        returnKeyType="next"
      />
    </View>
  );
}

function PowersyncUrlField({
  t,
  state,
  patch,
  onSubmit,
}: FieldsCommonProps & { onSubmit: () => void }): ReactElement {
  return (
    <View marginTop={12}>
      <TextField
        label={t('advancedBackend.powersyncUrl')}
        value={state.powersyncUrl}
        onChange={(v) => patch({ powersyncUrl: v })}
        placeholder="https://…powersync.journeyapps.com"
        testID="advanced-ps-input"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        blurOnSubmit
      />
    </View>
  );
}

function FormFields(props: FieldsCommonProps & { onSubmit: () => void }): ReactElement {
  return (
    <>
      <ProjectUrlField {...props} />
      <AnonKeyField {...props} />
      <PowersyncUrlField {...props} />
    </>
  );
}

function ActionButtons({
  t,
  state,
  save,
  onClear,
  onCancel,
}: {
  t: T;
  state: AdvancedState;
  save: () => Promise<void>;
  onClear: () => Promise<void>;
  onCancel: () => void;
}): ReactElement {
  return (
    <View gap={8}>
      <Btn
        variant="primary"
        onPress={save}
        fullWidth
        testID="advanced-save"
        disabled={state.status === 'saving'}
      >
        {state.status === 'saving' ? t('advancedBackend.saving') : t('advancedBackend.saveCta')}
      </Btn>
      <Btn variant="soft" onPress={onClear} fullWidth testID="advanced-clear">
        {t('advancedBackend.clearCta')}
      </Btn>
      <Btn variant="ghost" onPress={onCancel} fullWidth testID="advanced-cancel">
        {t('advancedBackend.cancel')}
      </Btn>
    </View>
  );
}

export function AdvancedBackendScreen(props: AdvancedBackendScreenProps): ReactElement {
  const { t } = useTranslation();
  const [state, patch] = useAdvancedState(props.existing);
  const save = useAdvancedSave(state, patch, props.onSave);
  return (
    <View
      testID={props.testID ?? 'advanced-backend-screen'}
      flex={1}
      padding={20}
      gap={16}
      backgroundColor={colors.offwhite}
    >
      <SectionTitle title={t('advancedBackend.title')} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.gray600}
      >
        {t('advancedBackend.warning')}
      </Text>
      <Card padding="md" fullWidth>
        <FormFields t={t} state={state} patch={patch} onSubmit={save} />
      </Card>
      <ActionButtons
        t={t}
        state={state}
        save={save}
        onClear={props.onClear}
        onCancel={props.onCancel}
      />
      {state.status === 'error' && state.errorMsg && (
        <Tag variant="danger" testID="advanced-error">
          {state.errorMsg}
        </Tag>
      )}
    </View>
  );
}

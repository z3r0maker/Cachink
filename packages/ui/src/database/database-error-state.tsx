import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card, ConfirmDialog, SectionTitle } from '../components/index';
import { useTranslation } from '../i18n/index';
import { colors, typography } from '../theme';

export interface DatabaseErrorStateProps {
  readonly error: Error;
  readonly copied: boolean;
  readonly resetOpen: boolean;
  readonly resetting: boolean;
  readonly canReset: boolean;
  readonly onRetry: () => void;
  readonly onCopy: () => void;
  readonly onReset: () => void | Promise<void>;
  readonly onResetOpenChange: (open: boolean) => void;
}

interface ActionsRowProps {
  readonly copied: boolean;
  readonly onRetry: () => void;
  readonly onCopy: () => void;
}

function ActionsRow(props: ActionsRowProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View flexDirection="row" gap={10} marginTop={12}>
      <Btn variant="dark" onPress={props.onRetry} testID="database-error-state-retry">
        {t('database.errorState.retry')}
      </Btn>
      <Btn variant="ghost" onPress={props.onCopy} testID="database-error-state-copy">
        {props.copied ? t('database.errorState.copied') : t('database.errorState.copy')}
      </Btn>
    </View>
  );
}

interface ResetRowProps {
  readonly resetting: boolean;
  readonly onResetOpenChange: (open: boolean) => void;
}

function ResetRow(props: ResetRowProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View marginTop={12}>
      <Btn
        variant="danger"
        onPress={() => props.onResetOpenChange(true)}
        disabled={props.resetting}
        testID="database-error-state-reset"
      >
        {t('database.errorState.reset')}
      </Btn>
    </View>
  );
}

interface ErrorBodyProps {
  readonly text: string;
}

function ErrorBody({ text }: ErrorBodyProps): ReactElement {
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.medium}
      fontSize={14}
      color={colors.gray600}
      marginVertical={10}
    >
      {text}
    </Text>
  );
}

interface ResetConfirmProps {
  readonly props: DatabaseErrorStateProps;
}

function ResetConfirm({ props }: ResetConfirmProps): ReactElement | null {
  const { t } = useTranslation();
  if (!props.canReset) return null;
  return (
    <ConfirmDialog
      open={props.resetOpen}
      onClose={() => props.onResetOpenChange(false)}
      onConfirm={props.onReset}
      title={t('database.errorState.resetConfirmTitle')}
      description={t('database.errorState.resetConfirmBody')}
      confirmLabel={t('database.errorState.resetConfirmAction')}
      tone="danger"
    />
  );
}

export function DatabaseErrorState(props: DatabaseErrorStateProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID="database-error-state"
      flex={1}
      padding={24}
      backgroundColor={colors.offwhite}
      alignItems="center"
      justifyContent="center"
    >
      <Card padding="lg" variant="yellow" fullWidth>
        <SectionTitle title={t('database.errorState.title')} />
        <ErrorBody text={t('database.errorState.body')} />
        <ActionsRow copied={props.copied} onRetry={props.onRetry} onCopy={props.onCopy} />
        {props.canReset ? (
          <ResetRow resetting={props.resetting} onResetOpenChange={props.onResetOpenChange} />
        ) : null}
      </Card>
      <ResetConfirm props={props} />
    </View>
  );
}

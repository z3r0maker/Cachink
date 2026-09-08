/**
 * BugReportSheet — production bug report flow.
 *
 * Server-first submit:
 *   1. User writes a description of the issue
 *   2. App auto-attaches last 50 audit + 20 error entries
 *   3. PII is scrubbed via @cachink/observability/pii-scrubber
 *   4. When consent is on → POST to Edge Function → user sees "Reporte enviado"
 *   5. On network failure → report is silently queued for retry
 *   6. "Compartir como archivo" remains as secondary button (and the only
 *      path when consent is off)
 */

import React, { type ReactElement } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { View, Text } from '@tamagui/core';
import type { DeviceContext, RemoteLogStore } from '@cachink/observability';
import { Btn } from '../../components/index';
import { useBugReportSubmit } from './use-bug-report-submit';
import { colors, fontSizes, radii, shadows, typography } from '../../theme';

export interface BugReportSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  /** Platform-specific share function. Receives the report JSON + optional text timeline. */
  readonly onShare: (json: string, filename: string, readableTimeline?: string) => void;
  /** Whether user has consented to remote submission. */
  readonly consentEnabled?: boolean;
  /** Remote log store for server-first submit. */
  readonly remote?: RemoteLogStore | null;
  /** Device context for enriching the report payload. */
  readonly deviceContext?: DeviceContext | null;
  /** Current feature flags state. */
  readonly featureFlags?: Record<string, boolean> | null;
  readonly testID?: string;
}

const INPUT_STYLE = {
  borderWidth: 2,
  borderColor: colors.black,
  borderRadius: 8,
  padding: 12,
  minHeight: 100,
  textAlignVertical: 'top' as const,
  fontSize: fontSizes.md,
};

function BugReportShell({
  testID,
  children,
}: {
  testID?: string;
  children: React.ReactNode;
}): ReactElement {
  return (
    <View
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      backgroundColor={colors.white}
      borderTopLeftRadius={radii[3]}
      borderTopRightRadius={radii[3]}
      maxHeight="60%"
      boxShadow={shadows.hero}
      testID={testID}
    >
      {children}
    </View>
  );
}

function BugReportHeader({ onClose }: { onClose: () => void }): ReactElement {
  return (
    <View
      flexDirection="row"
      justifyContent="space-between"
      padding={12}
      borderBottomWidth={1}
      borderBottomColor={colors.black}
    >
      <Text fontSize={fontSizes.lg} fontWeight={typography.weights.bold}>
        Enviar Reporte
      </Text>
      <Btn size="sm" variant="ghost" onPress={onClose}>
        ✕
      </Btn>
    </View>
  );
}

function BugReportBody(props: {
  description: string;
  onChangeDescription: (v: string) => void;
}): ReactElement {
  return (
    <ScrollView style={{ padding: 12 }}>
      <Text fontSize={fontSizes.sm} color={colors.gray600} marginBottom={8}>
        Describe el problema que encontraste. Se adjuntarán automáticamente los últimos 50 eventos y
        20 errores (sin datos personales).
      </Text>
      <TextInput
        placeholder="¿Qué pasó? ¿Qué esperabas que pasara?"
        multiline
        numberOfLines={4}
        value={props.description}
        onChangeText={props.onChangeDescription}
        style={INPUT_STYLE}
        testID="bug-report-description-input"
      />
    </ScrollView>
  );
}

/** Cancel plus the primary action, which sends remotely when that is wired up. */
function PrimaryActions(props: {
  onClose: () => void;
  onSubmitRemote?: () => void;
  onSubmitShare: () => void;
  disabled: boolean;
  isExporting: boolean;
  showRemoteSubmit: boolean;
}): ReactElement {
  const remote = props.showRemoteSubmit && props.onSubmitRemote !== undefined;
  return (
    <View flexDirection="row" gap={8}>
      <View flex={1}>
        <Btn variant="outline" fullWidth onPress={props.onClose}>
          Cancelar
        </Btn>
      </View>
      <View flex={1}>
        <Btn
          variant="primary"
          fullWidth
          onPress={remote ? props.onSubmitRemote : props.onSubmitShare}
          disabled={props.disabled}
          testID={remote ? 'bug-report-submit-btn' : 'bug-report-share-btn'}
        >
          {remote
            ? props.isExporting
              ? 'Enviando…'
              : 'Enviar Reporte'
            : props.isExporting
              ? 'Exportando…'
              : 'Compartir Reporte'}
        </Btn>
      </View>
    </View>
  );
}

function BugReportActions(props: {
  onClose: () => void;
  onSubmitRemote?: () => void;
  onSubmitShare: () => void;
  disabled: boolean;
  isExporting: boolean;
  showRemoteSubmit: boolean;
  statusMessage?: string;
}): ReactElement {
  return (
    <View padding={12} gap={8} borderTopWidth={2} borderTopColor={colors.black}>
      {props.statusMessage && (
        <Text fontSize={fontSizes.xs} color={colors.gray600} textAlign="center">
          {props.statusMessage}
        </Text>
      )}
      <PrimaryActions {...props} />
      {props.showRemoteSubmit && (
        <Btn
          variant="ghost"
          fullWidth
          onPress={props.onSubmitShare}
          disabled={props.disabled}
          testID="bug-report-share-fallback-btn"
        >
          Compartir como archivo
        </Btn>
      )}
    </View>
  );
}

export function BugReportSheet({
  visible,
  onClose,
  onShare,
  consentEnabled,
  remote,
  deviceContext,
  featureFlags,
  testID,
}: BugReportSheetProps): ReactElement | null {
  const {
    logStore,
    description,
    setDescription,
    isExporting,
    statusMessage,
    handleRemoteSubmit,
    handleShareSubmit,
  } = useBugReportSubmit(onShare, onClose, remote, deviceContext, featureFlags);

  if (!visible) return null;

  const showRemoteSubmit = consentEnabled === true && remote != null;

  return (
    <BugReportShell testID={testID ?? 'bug-report-sheet'}>
      <BugReportHeader onClose={onClose} />
      <BugReportBody description={description} onChangeDescription={setDescription} />
      <BugReportActions
        onClose={onClose}
        onSubmitRemote={showRemoteSubmit ? () => void handleRemoteSubmit() : undefined}
        onSubmitShare={() => void handleShareSubmit()}
        disabled={!description.trim() || isExporting || !logStore}
        isExporting={isExporting}
        showRemoteSubmit={showRemoteSubmit}
        statusMessage={statusMessage}
      />
    </BugReportShell>
  );
}

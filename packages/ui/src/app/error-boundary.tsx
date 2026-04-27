/**
 * AppErrorBoundary — root-level crash fallback (P1C-M12-T01, S4-C14).
 *
 * Catches render-time errors from the app-shell subtree and renders a
 * brand-styled card with:
 *   - "Algo salió mal" title
 *   - Short body
 *   - "Volver al inicio" Btn — fires `onReset`
 *   - "Copiar detalles" secondary Btn — writes `error.toString()` to
 *     `navigator.clipboard` for support paste-in
 *
 * When a Sentry-style listener is provided via `onError`, the boundary
 * calls it from `componentDidCatch` so crash reporting can attach. The
 * boundary itself imports nothing from Sentry — wiring lives in C16.
 */

import { Component, type ErrorInfo, type ReactElement, type ReactNode } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card, SectionTitle } from '../components/index';
import { i18n } from '../i18n/index';
import { colors, typography } from '../theme';

export interface AppErrorBoundaryProps {
  readonly children: ReactNode;
  readonly onError?: (error: Error, info: ErrorInfo) => void;
  readonly onReset?: () => void;
  readonly testID?: string;
}

interface AppErrorBoundaryState {
  readonly error: Error | null;
  readonly copied: boolean;
}

/**
 * Read a translation string without depending on React context — the
 * boundary renders outside the normal provider tree when the provider
 * itself throws.
 */
function t(key: string): string {
  return i18n.t(key as 'errorBoundary.title', { defaultValue: key }) as string;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { error: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error, copied: false };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  readonly #handleReset = (): void => {
    this.setState({ error: null, copied: false });
    this.props.onReset?.();
  };

  readonly #handleCopy = (): void => {
    const detail = this.state.error?.stack ?? this.state.error?.message ?? 'unknown';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(detail);
    }
    this.setState({ copied: true });
  };

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return this.renderFallback();
  }

  private renderFallback(): ReactElement {
    return (
      <View
        testID={this.props.testID ?? 'app-error-boundary'}
        flex={1}
        padding={24}
        backgroundColor={colors.offwhite}
        alignItems="center"
        justifyContent="center"
      >
        <FallbackCard
          copied={this.state.copied}
          onReset={this.#handleReset}
          onCopy={this.#handleCopy}
        />
      </View>
    );
  }
}

function FallbackCard(props: {
  copied: boolean;
  onReset: () => void;
  onCopy: () => void;
}): ReactElement {
  return (
    <Card padding="lg" variant="yellow" fullWidth>
      <SectionTitle title={t('errorBoundary.title')} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={14}
        color={colors.gray600}
        marginVertical={10}
      >
        {t('errorBoundary.body')}
      </Text>
      <View flexDirection="row" gap={10} marginTop={12}>
        <Btn variant="dark" onPress={props.onReset} testID="app-error-boundary-reset">
          {t('errorBoundary.reset')}
        </Btn>
        <Btn variant="ghost" onPress={props.onCopy} testID="app-error-boundary-copy">
          {props.copied ? t('errorBoundary.copied') : t('errorBoundary.copy')}
        </Btn>
      </View>
    </Card>
  );
}

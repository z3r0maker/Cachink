/**
 * `<ErrorState>` — branded error card with a primary retry action.
 *
 * Closes audit finding 6.5: every list screen reimplemented the same
 * "red-title Card + body + retry Btn" inline (`ErrorBanner` in
 * Ventas, Egresos, etc.). This primitive consolidates the shape so
 * error states stay consistent and the retry CTA always uses the
 * brand `danger` Btn variant.
 *
 * API mirrors the existing `<EmptyState>` so callers reach for the
 * same shape (title + body + optional CTA) regardless of whether the
 * "we have nothing to show" reason is "no rows yet" or "fetch
 * failed". Optional `retryLabel` + `onRetry` show a brand `danger`
 * Btn; omit both for a non-actionable banner (rare — keep at least
 * the copy button).
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn } from '../Btn/index';
import { Card } from '../Card/index';
import { colors, typography } from '../../theme';

export interface ErrorStateProps {
  readonly title: string;
  readonly body: string;
  /**
   * Label for the primary retry Btn. Omit (and `onRetry`) to render a
   * non-actionable banner — useful for unrecoverable errors.
   */
  readonly retryLabel?: string;
  readonly onRetry?: () => void;
  /** Forwarded to the root Card so E2E tests can anchor to it. */
  readonly testID?: string;
  /** Forwarded to the retry Btn so E2E tests can anchor to it. */
  readonly retryTestID?: string;
}

export function ErrorState(props: ErrorStateProps): ReactElement {
  const showRetry = props.retryLabel !== undefined && props.onRetry !== undefined;
  return (
    // Audit Round 2 G1: announces as `role="alert"` with
    // `aria-live="polite"` so screen readers surface the error
    // narrative without interrupting an in-progress flow. The
    // attributes live on a wrapping `<View>` because the underlying
    // `<Card>` primitive owns its own role logic (button when
    // tappable, none otherwise).
    <View role="alert" aria-live="polite">
      <Card testID={props.testID ?? 'error-state'} padding="md" fullWidth>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={18}
          color={colors.red}
        >
          {props.title}
        </Text>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={14}
          color={colors.gray600}
          marginTop={6}
          marginBottom={showRetry ? 12 : 0}
        >
          {props.body}
        </Text>
        {showRetry && (
          <Btn
            variant="danger"
            onPress={props.onRetry as () => void}
            testID={props.retryTestID ?? 'error-state-retry'}
          >
            {props.retryLabel as string}
          </Btn>
        )}
      </Card>
    </View>
  );
}

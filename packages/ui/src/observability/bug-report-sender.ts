/**
 * How «Reportar un problema» leaves the phone (N-81, contract §9, ADR-140):
 * through the device API, with the device's own token.
 *
 * It replaces the Supabase edge function the app once posted to with the
 * public anon key. The report now says only what happened and from what
 * build; who is reporting is the token's to say, and the server files it
 * under that device and its business.
 *
 * A phone that is not linked has no sender, so the sheet offers «compartir»
 * alone. A missing token or a refusal throws: the sheet catches it and points
 * at the share fallback.
 */

import { useMemo } from 'react';
import type { BugReportRequest } from '@xangarro/contracts';
import { useActivationContext } from '../activation/activation-context';
import { useActivationState } from '../activation/use-activation-state';

export interface BugReportSender {
  /** Resolves once the report is in the staff inbox; throws otherwise. */
  sendBugReport(report: BugReportRequest): Promise<void>;
}

/** The sender for a linked phone, or `null` when there is nobody to send as. */
export function useBugReportSender(): BugReportSender | null {
  const { client, config } = useActivationContext();
  const linked = useActivationState().record != null;
  const { tokenStore } = config;
  return useMemo(() => {
    if (!linked) return null;
    return {
      async sendBugReport(report) {
        const token = await tokenStore.get();
        if (token === null) throw new Error('NOT_ACTIVATED');
        const result = await client.bugReport(token, report);
        if (!result.ok) throw new Error(result.code);
      },
    };
  }, [client, tokenStore, linked]);
}

/**
 * What a bug report carries (contract §9, M-23): what the person tapped, the
 * sentence they may have added, the error the report names when it was opened
 * from one, the build, and the device's log snapshot, scrubbed. Pure; the
 * hook in `../../reportar/` owns state and the sending.
 *
 * What must never leave: a stack trace, a screenshot, or metadata the scrubber
 * knows as personal.
 */

import type { BugReportCategory, BugReportRequest } from '@xangarro/contracts';
import { scrubRecord, type DeviceContext, type LogSnapshot } from '@xangarro/observability';

function scrubSnapshot(snapshot: LogSnapshot) {
  return {
    ...snapshot,
    auditEvents: snapshot.auditEvents.map((e) => ({
      ...e,
      metadata: e.metadata ? scrubRecord(e.metadata) : undefined,
    })),
    errors: snapshot.errors.map((e) => ({
      ...e,
      context: e.context ? scrubRecord(e.context) : undefined,
      errorStack: undefined,
    })),
  };
}

export interface ReportData {
  readonly snapshot: LogSnapshot;
  readonly scrubbed: ReturnType<typeof scrubSnapshot>;
}

/** The snapshot and its scrubbed copy: what a report attaches. */
export function collectReport(snapshot: LogSnapshot): ReportData {
  return { snapshot, scrubbed: scrubSnapshot(snapshot) };
}

/** What the build is, for whoever reads the report; an unknown model is left out. */
function buildOf(deviceContext?: DeviceContext | null): Partial<BugReportRequest> {
  if (!deviceContext) return {};
  const { model, osName, osVersion, appVersion, platform } = deviceContext;
  return { osName, osVersion, appVersion, platform, ...(model ? { deviceModel: model } : {}) };
}

/** What the sheet collected: a tap, maybe a sentence, maybe the error it was opened from. */
export interface ReportInput {
  readonly category: BugReportCategory;
  readonly description: string;
  readonly eventId?: string | null;
}

/**
 * The wire payload (contract §9). It carries no device, business or user id:
 * the server takes those from the device token. With no log store there is no
 * snapshot, and the report still goes.
 */
export function toBugReport(
  input: ReportInput,
  data: ReportData | null,
  deviceContext?: DeviceContext | null,
): BugReportRequest {
  return {
    category: input.category,
    description: input.description.trim(),
    ...(input.eventId ? { eventId: input.eventId } : {}),
    submittedAt: new Date().toISOString(),
    ...buildOf(deviceContext),
    ...(data === null
      ? {}
      : {
          snapshot: {
            auditEvents: data.scrubbed.auditEvents as Record<string, unknown>[],
            errors: data.scrubbed.errors as Record<string, unknown>[],
          },
        }),
  };
}

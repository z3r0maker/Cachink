/**
 * What a bug report carries, built from the device's log snapshot: the
 * scrubbed copy, the readable timeline, and the two payloads — the contract's
 * request for a remote submit (§9, N-81) and the richer JSON a person receives
 * through the share sheet. Pure; the hook beside it owns state and the doors.
 *
 * What must never leave through either door: a stack trace, or metadata the
 * scrubber knows as personal.
 */

import type { BugReportRequest } from '@xangarro/contracts';
import {
  scrubRecord,
  formatTimelineAsText,
  type DeviceContext,
  type LogSnapshot,
  type TimelineEntry,
} from '@xangarro/observability';

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

function buildTimeline(snapshot: LogSnapshot): string {
  const allEntries: readonly TimelineEntry[] = [
    ...snapshot.auditEvents.map((e) => ({ type: 'audit' as const, ...e })),
    ...snapshot.errors.map((e) => ({ type: 'error' as const, ...e })),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return formatTimelineAsText(allEntries);
}

export interface ReportData {
  readonly snapshot: LogSnapshot;
  readonly scrubbed: ReturnType<typeof scrubSnapshot>;
  readonly readableTimeline: string;
}

/** The snapshot, its scrubbed copy and its timeline: everything a report is made of. */
export function collectReport(snapshot: LogSnapshot): ReportData {
  return {
    snapshot,
    scrubbed: scrubSnapshot(snapshot),
    readableTimeline: buildTimeline(snapshot),
  };
}

/** What the build is, for whoever reads the report; an unknown model is left out. */
function buildOf(deviceContext?: DeviceContext | null): Partial<BugReportRequest> {
  if (!deviceContext) return {};
  const { model, osName, osVersion, appVersion, platform } = deviceContext;
  return { osName, osVersion, appVersion, platform, ...(model ? { deviceModel: model } : {}) };
}

/**
 * The wire payload for a remote submit (contract §9). It carries no device,
 * business or user id: the server takes those from the device token.
 */
export function toBugReport(
  description: string,
  data: ReportData,
  deviceContext?: DeviceContext | null,
): BugReportRequest {
  return {
    description: description.trim(),
    submittedAt: new Date().toISOString(),
    ...buildOf(deviceContext),
    snapshot: {
      auditEvents: data.scrubbed.auditEvents as Record<string, unknown>[],
      errors: data.scrubbed.errors as Record<string, unknown>[],
    },
  };
}

/** The richer JSON a human receives through the share sheet. */
export function toSharedReport(
  description: string,
  data: ReportData,
  deviceContext?: DeviceContext | null,
  featureFlags?: Record<string, boolean> | null,
): Record<string, unknown> {
  return {
    description: description.trim(),
    submittedAt: new Date().toISOString(),
    readableTimeline: data.readableTimeline,
    snapshot: data.scrubbed,
    ...(deviceContext
      ? {
          deviceModel: deviceContext.model,
          osName: deviceContext.osName,
          osVersion: deviceContext.osVersion,
          appVersion: deviceContext.appVersion,
          platform: deviceContext.platform,
        }
      : {}),
    ...(featureFlags ? { featureFlags } : {}),
  };
}

/**
 * formatTimelineAsText — produces a human-readable timeline for bug reports.
 *
 * Generates a plain-text summary of audit + error events, suitable for
 * attachment to a shareable bug report. The user can read it themselves
 * or paste it into WhatsApp/email.
 */

import type { TimelineEntry } from './log-store.js';

/**
 * Format a list of timeline entries as a human-readable text report.
 *
 * @param entries - combined audit + error entries, sorted by timestamp
 * @param locale - BCP 47 locale for time formatting (default 'es-MX')
 * @returns multi-line string with emoji-coded timeline
 */
export function formatTimelineAsText(
  entries: readonly TimelineEntry[],
  locale: string = 'es-MX',
): string {
  const lines: string[] = [
    '=== Cachink! Timeline Report ===',
    `Generated: ${new Date().toLocaleString(locale)}`,
    `Total entries: ${entries.length}`,
    '',
  ];

  for (const entry of entries) {
    const time = formatTime(entry.timestamp, locale);

    if (entry.type === 'audit') {
      const status = entry.status === 'success' ? '✅' : '❌';
      const entityShort = entry.entityId ? entry.entityId.slice(0, 8) : '—';
      lines.push(`${time} ${status} ${entry.operation} → ${entry.entityType} ${entityShort}`);

      if (entry.durationMs != null) {
        lines.push(`         (${entry.durationMs}ms)`);
      }
      if (entry.status === 'error' && entry.errorMessage) {
        lines.push(`         Error: ${entry.errorMessage}`);
      }
    } else {
      lines.push(
        `${time} 🔴 ERROR [${entry.source}] ${entry.errorName}: ${entry.errorMessage}`,
      );
    }
  }

  lines.push('');
  lines.push('=== End of Report ===');
  return lines.join('\n');
}

function formatTime(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleTimeString(locale, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso.slice(11, 19);
  }
}

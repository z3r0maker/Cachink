/**
 * What the header's sync pill says.
 *
 * Pulled out of the component so the rule is testable without a DOM. The rule
 * itself is a product requirement, not styling: the pill says "Sincronizado"
 * **only** when the queue is empty, and otherwise reports the real count. A
 * label hardcoded independently of the number is a bug (design handoff,
 * "Header" — "The sync pill must tell the truth").
 */
export interface SyncPillState {
  readonly tone: 'success' | 'warning';
  readonly label: string;
}

export function syncPillState(pending: number): SyncPillState {
  if (!Number.isFinite(pending) || pending <= 0) {
    return { tone: 'success', label: 'Sincronizado' };
  }
  const noun = pending === 1 ? 'registro no enviado' : 'registros no enviados';
  return { tone: 'warning', label: `${pending} ${noun}` };
}

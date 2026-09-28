/**
 * app_config keys owned by cloud sync. The UI's APP_CONFIG_KEYS re-exports
 * these, so each key string is defined once (CLAUDE.md §2.3).
 */

export const SYNC_CONFIG_KEYS = {
  /** JSON SignedEntitlement last received (A-10 verifies it). */
  entitlement: 'entitlement',
  /** ISO server time last seen — anchors every clock decision (Q9). */
  lastServerTime: 'lastServerTime',
  /** Highest serverSeq applied from pulls. */
  pullSeq: 'pullSeq',
  /** The next page of an unfinished snapshot bootstrap (C-23); absent once it is complete. */
  bootstrapNext: 'bootstrapNext',
  /** Snapshot pages applied so far (DS-10); absent once the snapshot is complete. */
  bootstrapPage: 'bootstrapPage',
  /** The first snapshot page's estimate of its pages (DS-10); absent if none or complete. */
  bootstrapPages: 'bootstrapPages',
  /** Highest __xangarro_change_log.id already handed to the pusher. */
  pushHwm: 'pushHwm',
  /** JSON `{at, count}`: 5xx answers in a row to the same first push batch (DB3-SYNC-01 b). */
  pushStrikes: 'pushStrikes',
  /** Highest serverSeq the server durably stored for this device's pushes. */
  acknowledgedThrough: 'acknowledgedThrough',
  /** ISO time of the last successful pull (offline-staleness clock). */
  lastPullAt: 'lastPullAt',
  /** Server time of the last retention purge (A-11) — runs at most daily. */
  lastPurgeAt: 'lastPurgeAt',
  /** The owner's display name as the last pull sent it (absent: unknown). */
  duenoNombre: 'duenoNombre',
} as const;

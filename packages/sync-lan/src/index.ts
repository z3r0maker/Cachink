/**
 * @cachink/sync-lan — first-party LAN sync client. Phase 1D per ROADMAP.md.
 *
 * The Rust server lives inside `apps/desktop/src-tauri/` and exposes HTTP +
 * WebSocket endpoints; this JS package is the client that runs on every
 * device (mobile tablet or desktop) when LAN mode is active.
 *
 * This package is lazy-loaded — Local and Cloud modes never import it.
 * See CLAUDE.md §7.2 and ADR-007.
 */
export const __version__ = '0.0.0';

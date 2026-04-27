// Cachink LAN sync server (Phase 1D — ADR-029 / ADR-030).
//
// Hosts an axum HTTP + WebSocket server on the local network so nearby
// tablets running the Expo app can sync their SQLite databases against the
// desktop's canonical copy. First-party — no external services involved.
//
// Module layout:
//   - `state`   — in-memory + on-disk token state, server handle, broadcast
//                 channel for WebSocket fan-out.
//   - `protocol` — Rust mirror of the wire types in
//                  `packages/sync-lan/src/protocol`. Kept in lock-step with
//                  the JS via the protocol version `PROTOCOL_VERSION`.
//   - `qr`      — PNG / base64 QR rendering for the pairing screen.
//   - `routes`  — axum handlers for `/pair`, `/sync/push`, `/sync/pull`,
//                 `/sync/events`.
//   - `sqlite`  — rusqlite connection-pool helpers.
//
// Three Tauri commands are exposed to the renderer:
//   - `lan_server_start(bind_addr)` → starts the server, returns URL,
//      QR base64, and the pairing token.
//   - `lan_server_stop()`
//   - `lan_server_connections()` → count of paired devices currently
//      holding an open WebSocket (drives the TopBar "N dispositivos" badge).

pub mod protocol;
pub mod qr;
pub mod routes;
pub mod sqlite;
pub mod state;

use crate::lan_sync::state::{LanServerHandle, SharedState};
use std::net::SocketAddr;
use tauri::{AppHandle, Manager, State};

/// Bind the server on a port in the range 43800..=43899 (ADR-029). The
/// first free port wins; collision retries are silent.
const PORT_RANGE_START: u16 = 43800;
const PORT_RANGE_END: u16 = 43899;

/// Shape returned by `lan_server_start` to the JS renderer. Matches the
/// payload Slice 5 C17's `LanHostScreen.tsx` consumes.
#[derive(serde::Serialize)]
pub struct LanStartResult {
    pub url: String,
    pub pairing_token: String,
    pub qr_png_base64: String,
    pub protocol: u32,
}

/// Tauri command — start the LAN sync server. Idempotent: if a server is
/// already running, returns the existing handle's URL/token unchanged.
#[tauri::command]
pub async fn lan_server_start(
    app: AppHandle,
    state: State<'_, SharedState>,
) -> Result<LanStartResult, String> {
    let db_path = crate::lan_sync::sqlite::resolve_cachink_db(&app)
        .map_err(|e| format!("resolve cachink.db: {e}"))?;
    let state_path = crate::lan_sync::state::resolve_state_path(&app)
        .map_err(|e| format!("resolve state path: {e}"))?;

    let handle = state
        .start_if_stopped(PORT_RANGE_START, PORT_RANGE_END, &db_path, &state_path)
        .await
        .map_err(|e| format!("start server: {e}"))?;

    Ok(LanStartResult {
        url: format!("http://{}", handle.addr()),
        pairing_token: handle.pairing_token().to_owned(),
        qr_png_base64: crate::lan_sync::qr::render_pairing_qr(handle.addr(), handle.pairing_token())
            .map_err(|e| format!("QR render: {e}"))?,
        protocol: crate::lan_sync::protocol::PROTOCOL_VERSION,
    })
}

/// Tauri command — stop the LAN sync server. Safe to call when already
/// stopped (no-op).
#[tauri::command]
pub async fn lan_server_stop(state: State<'_, SharedState>) -> Result<(), String> {
    state.stop().await.map_err(|e| format!("stop server: {e}"))
}

/// Tauri command — count of distinct paired devices currently holding an
/// open WebSocket connection. Drives the TopBar sync badge.
#[tauri::command]
pub async fn lan_server_connections(state: State<'_, SharedState>) -> Result<usize, String> {
    Ok(state.connected_devices().await)
}

/// Helper used by the main lib.rs to manage the shared state + register
/// commands in one place. Keeps the top-level builder compact.
pub fn install(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let shared = SharedState::new();
    app.manage(shared);
    Ok(())
}

/// Utility re-export so the server can be bound explicitly in tests.
pub fn bind_addr(port: u16) -> SocketAddr {
    SocketAddr::from(([0, 0, 0, 0], port))
}

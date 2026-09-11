// Tauri 2 entry library for the Cachink! desktop app.
//
// Phase 0 scope: register the built-in Tauri plugins we know we will need
// from Phase 1 onwards (SQL for SQLite access, opener for external links),
// and expose a trivial `ping` command for the frontend to smoke-test the
// bridge from JS → Rust. Real Cachink domain/use-case logic never lands
// here — business logic lives in `packages/application` / `packages/domain`
// and is called from the React frontend.
//
// Phase 1D adds the `lan_sync` module: a first-party axum HTTP + WebSocket
// server (ADR-029) bundled into the desktop binary. Tablets on the same
// Wi-Fi pair with it; sync happens against the same `cachink.db` file the
// Tauri SQL plugin manages.

pub mod lan_sync;

/// Trivial command used only to smoke-test the JS → Rust bridge during
/// Phase 0 verification. Kept around because it's a cheap readiness
/// probe the frontend calls on cold start.
#[tauri::command]
fn ping() -> &'static str {
    "pong"
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info,cachink=debug")),
        )
        .try_init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        // ADR-026 — desktop notification plugin for Phase 1C-M11.
        .plugin(tauri_plugin_notification::init())
        // ADR-036 — auto-update via GitHub Releases RSS.
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Register Phase 1D LAN-sync state so #[tauri::command] handlers
            // below can grab it via `State<'_, SharedState>`.
            lan_sync::install(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ping,
            lan_sync::lan_server_start,
            lan_sync::lan_server_stop,
            lan_sync::lan_server_connections,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

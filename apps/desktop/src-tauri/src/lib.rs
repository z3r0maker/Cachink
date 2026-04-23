// Tauri 2 entry library for the Cachink! desktop app.
//
// Phase 0 scope: register the built-in Tauri plugins we know we will need
// from Phase 1 onwards (SQL for SQLite access, opener for external links),
// and expose a trivial `ping` command for the frontend to smoke-test the
// bridge from JS → Rust. Real Cachink domain/use-case logic never lands
// here — business logic lives in `packages/application` / `packages/domain`
// and is called from the React frontend.

/// Trivial command used only to smoke-test the JS → Rust bridge during
/// Phase 0 verification. Remove once Phase 1D's LAN-sync commands land.
#[tauri::command]
fn ping() -> &'static str {
    "pong"
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![ping])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

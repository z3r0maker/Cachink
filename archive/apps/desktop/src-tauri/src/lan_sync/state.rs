// Shared server state (ADR-029 §Pairing, §Decision).
//
// Holds:
//   - the bound axum server's address + a cancellation handle,
//   - the ephemeral pairing token + business id + server id,
//   - a device_id → access_token map (persisted to `lan_sync_state.json`),
//   - a broadcast channel that WebSocket handlers subscribe to so every
//     accepted `/sync/push` wakes up every connected client.
//
// All methods are async because they grab a `tokio::sync::Mutex`. Contention
// is minimal — the server has at most ~3 tablets and a handful of request
// handlers per second.

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::{SocketAddr, TcpListener};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use tokio::sync::{broadcast, Mutex};
use tokio::task::JoinHandle;

use crate::lan_sync::sqlite::SqlitePool;

/// Payload pushed to WS subscribers after every accepted `/sync/push`.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangeEvent {
    pub server_seq: i64,
}

/// Result of a successful bind — handed back to the renderer.
pub struct LanServerHandle {
    addr: SocketAddr,
    pairing_token: String,
    business_id: String,
    server_id: String,
    shutdown: tokio::sync::oneshot::Sender<()>,
    join: JoinHandle<()>,
    pub tx: broadcast::Sender<ChangeEvent>,
    pub pool: SqlitePool,
    pub tokens: Arc<Mutex<TokenStore>>,
}

impl LanServerHandle {
    pub fn addr(&self) -> SocketAddr {
        self.addr
    }
    pub fn pairing_token(&self) -> &str {
        &self.pairing_token
    }
    pub fn business_id(&self) -> &str {
        &self.business_id
    }
    pub fn server_id(&self) -> &str {
        &self.server_id
    }
    pub async fn shutdown(self) {
        let _ = self.shutdown.send(());
        let _ = self.join.await;
    }
}

/// Token store — persisted to `lan_sync_state.json` so a desktop restart
/// doesn't invalidate already-paired tablets.
#[derive(Default, Serialize, Deserialize)]
pub struct TokenStore {
    pub pairing_token: String,
    pub business_id: String,
    pub server_id: String,
    pub devices: HashMap<String, String>,
}

impl TokenStore {
    pub fn load_or_init(path: &Path) -> Self {
        if let Ok(bytes) = std::fs::read(path) {
            if let Ok(parsed) = serde_json::from_slice::<Self>(&bytes) {
                return parsed;
            }
        }
        Self::default()
    }

    pub fn save(&self, path: &Path) -> Result<(), String> {
        let parent = path.parent().ok_or("state path has no parent")?;
        std::fs::create_dir_all(parent).map_err(|e| format!("mkdir state dir: {e}"))?;
        let bytes = serde_json::to_vec_pretty(self).map_err(|e| format!("serialise: {e}"))?;
        std::fs::write(path, bytes).map_err(|e| format!("write state: {e}"))
    }
}

/// Managed as Tauri state — `#[tauri::command]` functions pull this via
/// `State<'_, SharedState>`.
#[derive(Default)]
pub struct SharedState {
    inner: Mutex<Option<LanServerHandle>>,
}

impl SharedState {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn start_if_stopped(
        &self,
        port_start: u16,
        port_end: u16,
        db_path: &Path,
        state_path: &Path,
    ) -> Result<LanServerSummary, String> {
        let mut slot = self.inner.lock().await;
        if let Some(existing) = slot.as_ref() {
            return Ok(LanServerSummary {
                addr: existing.addr(),
                pairing_token: existing.pairing_token().to_owned(),
            });
        }

        let (addr, listener) = pick_free_port(port_start, port_end)?;
        let pool = crate::lan_sync::sqlite::build_pool(db_path)?;

        let store = TokenStore::load_or_init(state_path);
        let (pairing_token, business_id, server_id) = (
            non_empty_or_new(&store.pairing_token),
            non_empty_or_new(&store.business_id),
            non_empty_or_new(&store.server_id),
        );

        let store = TokenStore {
            pairing_token: pairing_token.clone(),
            business_id: business_id.clone(),
            server_id: server_id.clone(),
            devices: store.devices,
        };
        store.save(state_path)?;

        let tokens = Arc::new(Mutex::new(store));
        let (tx, _rx) = broadcast::channel::<ChangeEvent>(32);
        let (shutdown_tx, shutdown_rx) = tokio::sync::oneshot::channel::<()>();
        let router = crate::lan_sync::routes::build_router(
            pool.clone(),
            tokens.clone(),
            tx.clone(),
            state_path.to_path_buf(),
        );

        let join = tokio::spawn(async move {
            let _ = axum::serve(
                tokio::net::TcpListener::from_std(listener).expect("tokio listener"),
                router,
            )
            .with_graceful_shutdown(async move {
                let _ = shutdown_rx.await;
            })
            .await;
        });

        let summary = LanServerSummary {
            addr,
            pairing_token: pairing_token.clone(),
        };
        *slot = Some(LanServerHandle {
            addr,
            pairing_token,
            business_id,
            server_id,
            shutdown: shutdown_tx,
            join,
            tx,
            pool,
            tokens,
        });
        Ok(summary)
    }

    pub async fn stop(&self) -> Result<(), String> {
        let mut slot = self.inner.lock().await;
        if let Some(handle) = slot.take() {
            handle.shutdown().await;
        }
        Ok(())
    }

    pub async fn connected_devices(&self) -> usize {
        let slot = self.inner.lock().await;
        slot.as_ref()
            .map(|h| h.tx.receiver_count())
            .unwrap_or(0)
    }
}

/// Minimal snapshot the renderer actually needs. The full handle is kept
/// private so the WebSocket broadcast tx can't leak across awaits.
pub struct LanServerSummary {
    pub addr: SocketAddr,
    pub pairing_token: String,
}

impl LanServerSummary {
    pub fn addr(&self) -> SocketAddr {
        self.addr
    }
    pub fn pairing_token(&self) -> &str {
        &self.pairing_token
    }
}

fn pick_free_port(start: u16, end: u16) -> Result<(SocketAddr, TcpListener), String> {
    for port in start..=end {
        let addr = SocketAddr::from(([0, 0, 0, 0], port));
        if let Ok(listener) = TcpListener::bind(addr) {
            listener
                .set_nonblocking(true)
                .map_err(|e| format!("set nonblocking: {e}"))?;
            return Ok((addr, listener));
        }
    }
    Err(format!(
        "no free port in {start}..={end}; close another process on those ports",
    ))
}

fn non_empty_or_new(current: &str) -> String {
    if current.is_empty() {
        random_token()
    } else {
        current.to_owned()
    }
}

pub fn random_token() -> String {
    let mut bytes = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

/// Resolve where `lan_sync_state.json` lives on disk. Under the Tauri
/// app-data dir so it survives upgrades but is wiped on macOS "move to
/// trash" of the app bundle.
pub fn resolve_state_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir: {e}"))?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("create data dir: {e}"))?;
    Ok(dir.join("lan_sync_state.json"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn random_token_is_url_safe_and_sufficiently_long() {
        let t = random_token();
        assert!(t.len() >= 20);
        for ch in t.chars() {
            assert!(ch.is_ascii_alphanumeric() || ch == '-' || ch == '_');
        }
    }

    #[test]
    fn token_store_round_trips_through_tempfile() {
        let dir = tempdir_for_test();
        let path = dir.join("lan_sync_state.json");
        let mut store = TokenStore::default();
        store.pairing_token = "tok".into();
        store.business_id = "biz".into();
        store.server_id = "srv".into();
        store.devices.insert("dev".into(), "access".into());
        store.save(&path).unwrap();
        let reloaded = TokenStore::load_or_init(&path);
        assert_eq!(reloaded.pairing_token, "tok");
        assert_eq!(reloaded.devices.get("dev").map(String::as_str), Some("access"));
    }

    fn tempdir_for_test() -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("cachink-lan-test-{}", random_token()));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }
}

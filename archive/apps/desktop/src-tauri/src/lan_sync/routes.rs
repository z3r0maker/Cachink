// axum router + handlers for the LAN sync server (ADR-029).
//
// Endpoints under `/api/v1`:
//   - `POST /pair`          — exchange pairing token for a device access token
//   - `POST /sync/push`     — push a batch of deltas (LWW-resolved)
//   - `GET  /sync/pull`     — pull deltas since server_seq
//   - `WS   /sync/events`   — fan-out `{type:'change', serverSeq}` frames
//
// Every response carries `X-Cachink-Protocol: 1`. Requests sending a
// different protocol version receive `426 Upgrade Required`.

use crate::lan_sync::protocol::{
    self as wire, Delta, PairRequest, PairResponse, PullResponse, PushRequest, PushResponse,
    RejectedDelta, WireError,
};
use crate::lan_sync::sqlite::SqlitePool;
use crate::lan_sync::state::{ChangeEvent, TokenStore};
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    http::{HeaderMap, HeaderValue, Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{broadcast, Mutex};

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub tokens: Arc<Mutex<TokenStore>>,
    pub tx: broadcast::Sender<ChangeEvent>,
    pub state_path: PathBuf,
}

pub fn build_router(
    pool: SqlitePool,
    tokens: Arc<Mutex<TokenStore>>,
    tx: broadcast::Sender<ChangeEvent>,
    state_path: PathBuf,
) -> Router {
    let state = AppState {
        pool,
        tokens,
        tx,
        state_path,
    };
    let authed = Router::new()
        .route("/sync/push", post(push_handler))
        .route("/sync/pull", get(pull_handler))
        .route("/sync/events", get(ws_handler))
        .layer(middleware::from_fn_with_state(state.clone(), auth_middleware));

    let api = Router::new()
        .route("/pair", post(pair_handler))
        .merge(authed)
        .with_state(state);

    Router::new()
        .nest(wire::API_PREFIX, api)
        .layer(middleware::from_fn(protocol_middleware))
        .layer(tower_http::cors::CorsLayer::permissive())
}

// ---------- middleware ----------

async fn protocol_middleware(req: Request<axum::body::Body>, next: Next) -> Response {
    if let Some(v) = req.headers().get(wire::PROTOCOL_HEADER) {
        if v.to_str().unwrap_or("") != wire::PROTOCOL_VERSION.to_string() {
            let body = WireError {
                error: "Protocol version mismatch".into(),
                code: "protocol_mismatch".into(),
                protocol_required: Some(wire::PROTOCOL_VERSION),
                protocol_received: Some(v.to_str().unwrap_or("").to_owned()),
            };
            let mut res = (StatusCode::UPGRADE_REQUIRED, Json(body)).into_response();
            inject_protocol_header(res.headers_mut());
            return res;
        }
    }
    let mut res = next.run(req).await;
    inject_protocol_header(res.headers_mut());
    res
}

async fn auth_middleware(
    State(state): State<AppState>,
    req: Request<axum::body::Body>,
    next: Next,
) -> Response {
    let token = extract_bearer(req.headers())
        .or_else(|| extract_query_token(req.uri().query()));
    if let Some(tok) = token {
        let store = state.tokens.lock().await;
        if store.devices.values().any(|v| v == &tok) {
            drop(store);
            return next.run(req).await;
        }
    }
    let err = WireError::new("unauthorized", "Missing or invalid Bearer token");
    (StatusCode::UNAUTHORIZED, Json(err)).into_response()
}

fn inject_protocol_header(headers: &mut HeaderMap) {
    if let Ok(v) = HeaderValue::from_str(&wire::PROTOCOL_VERSION.to_string()) {
        headers.insert(wire::PROTOCOL_HEADER, v);
    }
}

fn extract_bearer(headers: &HeaderMap) -> Option<String> {
    headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .map(str::to_owned)
}

fn extract_query_token(query: Option<&str>) -> Option<String> {
    query.and_then(|q| {
        q.split('&').find_map(|kv| {
            let mut parts = kv.splitn(2, '=');
            match (parts.next(), parts.next()) {
                (Some("token"), Some(v)) => Some(v.to_owned()),
                _ => None,
            }
        })
    })
}

// ---------- handlers ----------

async fn pair_handler(
    State(state): State<AppState>,
    Json(req): Json<PairRequest>,
) -> Response {
    let mut store = state.tokens.lock().await;
    if req.pairing_token != store.pairing_token {
        drop(store);
        let err = WireError::new("invalid_token", "Pairing token rejected");
        return (StatusCode::UNAUTHORIZED, Json(err)).into_response();
    }
    let access_token = crate::lan_sync::state::random_token();
    store
        .devices
        .insert(req.device_id.clone(), access_token.clone());
    let snapshot = TokenStore {
        pairing_token: store.pairing_token.clone(),
        business_id: store.business_id.clone(),
        server_id: store.server_id.clone(),
        devices: store.devices.clone(),
    };
    drop(store);
    let _ = snapshot.save(&state.state_path);

    let body = PairResponse {
        access_token,
        business_id: snapshot.business_id,
        server_id: snapshot.server_id,
    };
    (StatusCode::OK, Json(body)).into_response()
}

async fn push_handler(
    State(state): State<AppState>,
    Json(req): Json<PushRequest>,
) -> Response {
    if req.deltas.len() > wire::MAX_BATCH_SIZE {
        let err = WireError::new("batch_too_large", "Maximum 500 deltas per push");
        return (StatusCode::PAYLOAD_TOO_LARGE, Json(err)).into_response();
    }
    let mut accepted = 0usize;
    let mut rejected: Vec<RejectedDelta> = Vec::new();
    let mut conn = match state.pool.get() {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("pool.get: {e}");
            let err = WireError::new("server_error", "Database unavailable");
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(err)).into_response();
        }
    };
    for delta in req.deltas {
        if !wire::is_synced_table(&delta.table) || !wire::is_valid_op(&delta.op) {
            rejected.push(RejectedDelta {
                row_id: delta.row_id,
                table: delta.table,
                reason: "invalid".into(),
            });
            continue;
        }
        match crate::lan_sync::sqlite::upsert_lww(&mut conn, &delta.table, &delta.row) {
            Ok(true) => accepted += 1,
            Ok(false) => rejected.push(RejectedDelta {
                row_id: delta.row_id,
                table: delta.table,
                reason: "stale".into(),
            }),
            Err(e) => {
                tracing::warn!("upsert err: {e}");
                rejected.push(RejectedDelta {
                    row_id: delta.row_id,
                    table: delta.table,
                    reason: "invalid".into(),
                });
            }
        }
    }

    let last_server_seq = fetch_last_server_seq(&conn).unwrap_or(0);
    if accepted > 0 {
        let _ = state.tx.send(ChangeEvent {
            server_seq: last_server_seq,
        });
    }

    let body = PushResponse {
        accepted,
        rejected,
        last_server_seq,
    };
    (StatusCode::OK, Json(body)).into_response()
}

#[derive(Deserialize)]
struct PullQuery {
    since: Option<i64>,
    limit: Option<i64>,
}

async fn pull_handler(
    State(state): State<AppState>,
    Query(q): Query<PullQuery>,
) -> Response {
    let since = q.since.unwrap_or(0);
    let limit = q
        .limit
        .unwrap_or(wire::MAX_BATCH_SIZE as i64)
        .min(wire::MAX_BATCH_SIZE as i64)
        .max(1);

    let conn = match state.pool.get() {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("pool.get: {e}");
            let err = WireError::new("server_error", "Database unavailable");
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(err)).into_response();
        }
    };
    let deltas = match fetch_deltas_since(&conn, since, limit) {
        Ok(d) => d,
        Err(e) => {
            tracing::warn!("pull err: {e}");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(WireError::new("server_error", "Pull failed")),
            )
                .into_response();
        }
    };
    let next_since = deltas
        .iter()
        .map(|(id, _)| *id)
        .max()
        .unwrap_or(since);
    let has_more = deltas.len() as i64 >= limit;
    let body = PullResponse {
        deltas: deltas.into_iter().map(|(_, d)| d).collect(),
        next_since,
        has_more,
    };
    (StatusCode::OK, Json(body)).into_response()
}

async fn ws_handler(State(state): State<AppState>, ws: WebSocketUpgrade) -> Response {
    ws.on_upgrade(move |socket| ws_session(socket, state.tx.clone()))
}

async fn ws_session(socket: WebSocket, tx: broadcast::Sender<ChangeEvent>) {
    let (mut sink, mut stream) = socket.split();
    let mut rx = tx.subscribe();
    let mut heartbeat =
        tokio::time::interval(std::time::Duration::from_secs(20));
    heartbeat.tick().await; // drop the immediate tick
    loop {
        tokio::select! {
            evt = rx.recv() => {
                match evt {
                    Ok(change) => {
                        let payload = serde_json::json!({
                            "type": "change",
                            "serverSeq": change.server_seq,
                        });
                        if sink.send(Message::Text(payload.to_string().into())).await.is_err() {
                            break;
                        }
                    }
                    Err(_) => break,
                }
            }
            _ = heartbeat.tick() => {
                let payload = serde_json::json!({
                    "type": "ping",
                    "ts": iso_now(),
                });
                if sink.send(Message::Text(payload.to_string().into())).await.is_err() {
                    break;
                }
            }
            msg = stream.next() => {
                if matches!(msg, None | Some(Ok(Message::Close(_))) | Some(Err(_))) {
                    break;
                }
            }
        }
    }
}

fn iso_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default();
    let secs = now.as_secs();
    let millis = now.subsec_millis();
    // Simple RFC3339 formatter — no chrono dep for a single call site.
    let (y, mo, d, h, mi, s) = epoch_to_ymdhms(secs);
    format!("{y:04}-{mo:02}-{d:02}T{h:02}:{mi:02}:{s:02}.{millis:03}Z")
}

fn epoch_to_ymdhms(secs: u64) -> (u32, u32, u32, u32, u32, u32) {
    // Enough precision for a heartbeat stamp; not calendar-accurate for
    // pre-1970 dates. Good enough for "when did the server ping".
    let days = secs / 86_400;
    let rem = secs % 86_400;
    let h = (rem / 3600) as u32;
    let mi = ((rem % 3600) / 60) as u32;
    let s = (rem % 60) as u32;
    let (y, mo, d) = days_to_date(days as i64);
    (y, mo, d, h, mi, s)
}

fn days_to_date(days_since_epoch: i64) -> (u32, u32, u32) {
    // Howard Hinnant "date" algorithm (public domain).
    let z = days_since_epoch + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as i64;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    let year = (y + if m <= 2 { 1 } else { 0 }) as u32;
    (year, m, d)
}

fn fetch_last_server_seq(conn: &rusqlite::Connection) -> rusqlite::Result<i64> {
    conn.query_row(
        "SELECT COALESCE(MAX(id), 0) FROM __cachink_change_log",
        [],
        |r| r.get(0),
    )
}

fn fetch_deltas_since(
    conn: &rusqlite::Connection,
    since: i64,
    limit: i64,
) -> rusqlite::Result<Vec<(i64, Delta)>> {
    let mut out: Vec<(i64, Delta)> = Vec::new();
    let mut stmt = conn.prepare(
        "SELECT id, table_name, row_id, row_updated_at, row_device_id, op
         FROM __cachink_change_log
         WHERE id > ?1
         ORDER BY id ASC
         LIMIT ?2",
    )?;
    let rows = stmt.query_map((since, limit), |r| {
        Ok(ChangeLogEntry {
            id: r.get(0)?,
            table_name: r.get(1)?,
            row_id: r.get(2)?,
            row_updated_at: r.get(3)?,
            row_device_id: r.get(4)?,
            op: r.get(5)?,
        })
    })?;
    for row in rows {
        let entry = row?;
        if let Some(row_map) = fetch_row(conn, &entry.table_name, &entry.row_id)? {
            let delta = Delta {
                table: entry.table_name,
                op: entry.op,
                row_id: entry.row_id,
                row: row_map,
                row_updated_at: entry.row_updated_at,
                row_device_id: entry.row_device_id,
            };
            out.push((entry.id, delta));
        }
    }
    Ok(out)
}

struct ChangeLogEntry {
    id: i64,
    table_name: String,
    row_id: String,
    row_updated_at: String,
    row_device_id: String,
    op: String,
}

fn fetch_row(
    conn: &rusqlite::Connection,
    table: &str,
    row_id: &str,
) -> rusqlite::Result<Option<serde_json::Map<String, serde_json::Value>>> {
    if !wire::is_synced_table(table) {
        return Ok(None);
    }
    let sql = format!("SELECT * FROM \"{table}\" WHERE id = ?1 LIMIT 1");
    let mut stmt = conn.prepare(&sql)?;
    let col_names: Vec<String> = stmt
        .column_names()
        .iter()
        .map(|c| (*c).to_owned())
        .collect();
    let money_cols: std::collections::HashSet<&str> =
        wire::money_columns(table).iter().copied().collect();
    let mut rows = stmt.query([row_id])?;
    if let Some(r) = rows.next()? {
        let mut map: HashMap<String, serde_json::Value> = HashMap::new();
        for (idx, name) in col_names.iter().enumerate() {
            let v: rusqlite::types::Value = r.get(idx)?;
            map.insert(name.clone(), sqlite_to_json(v, money_cols.contains(name.as_str())));
        }
        let mut ordered = serde_json::Map::new();
        for name in col_names {
            if let Some(v) = map.remove(&name) {
                ordered.insert(name, v);
            }
        }
        Ok(Some(ordered))
    } else {
        Ok(None)
    }
}

fn sqlite_to_json(v: rusqlite::types::Value, is_money: bool) -> serde_json::Value {
    use rusqlite::types::Value as V;
    match v {
        V::Null => serde_json::Value::Null,
        V::Integer(i) if is_money => serde_json::Value::String(i.to_string()),
        V::Integer(i) => serde_json::Value::Number(i.into()),
        V::Real(f) => serde_json::json!(f),
        V::Text(t) if is_money => serde_json::Value::String(t),
        V::Text(t) => serde_json::Value::String(t),
        V::Blob(_) => serde_json::Value::Null,
    }
}

// Rust mirror of the wire types defined in
// `packages/sync-lan/src/protocol/`. Keep in lock-step with `wire.ts` and
// `codec.ts` — ADR-029 §Decision lists the canonical shape.
//
// Kept in a single file on purpose: the whole protocol is <200 lines and
// splitting it forces awkward `pub use` ladders for no gain.

use serde::{Deserialize, Serialize};

pub const PROTOCOL_VERSION: u32 = 1;
pub const PROTOCOL_HEADER: &str = "X-Cachink-Protocol";
pub const API_PREFIX: &str = "/api/v1";
pub const MAX_BATCH_SIZE: usize = 500;

/// The 10 synced tables (ADR-029). `app_config` is intentionally excluded.
pub const SYNCED_TABLES: &[&str] = &[
    "businesses",
    "sales",
    "expenses",
    "products",
    "inventory_movements",
    "employees",
    "clients",
    "client_payments",
    "day_closes",
    "recurring_expenses",
];

/// Columns that carry bigint money values per table. Wire values are
/// decimal strings — rusqlite binds them as TEXT; SQLite's `NUMERIC`
/// affinity coerces on insert.
pub fn money_columns(table: &str) -> &'static [&'static str] {
    match table {
        "sales" | "expenses" | "client_payments" | "recurring_expenses" => &["monto_centavos"],
        "products" | "inventory_movements" => &["costo_unit_centavos"],
        "employees" => &["salario_centavos"],
        "day_closes" => &[
            "efectivo_esperado_centavos",
            "efectivo_contado_centavos",
            "diferencia_centavos",
        ],
        _ => &[],
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Delta {
    pub table: String,
    pub op: String,
    pub row_id: String,
    pub row: serde_json::Map<String, serde_json::Value>,
    pub row_updated_at: String,
    pub row_device_id: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PairRequest {
    pub pairing_token: String,
    pub device_id: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PairResponse {
    pub access_token: String,
    pub business_id: String,
    pub server_id: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PushRequest {
    pub deltas: Vec<Delta>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RejectedDelta {
    pub row_id: String,
    pub table: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PushResponse {
    pub accepted: usize,
    pub rejected: Vec<RejectedDelta>,
    pub last_server_seq: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PullResponse {
    pub deltas: Vec<Delta>,
    pub next_since: i64,
    pub has_more: bool,
}

/// Shared error envelope sent on every 4xx/5xx response.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WireError {
    pub error: String,
    pub code: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub protocol_required: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub protocol_received: Option<String>,
}

impl WireError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            error: message.into(),
            code: code.to_owned(),
            protocol_required: None,
            protocol_received: None,
        }
    }
}

/// Only `insert` / `update` are valid over the wire. Soft-deletes travel
/// as `update` with `deleted_at` set.
pub fn is_valid_op(op: &str) -> bool {
    matches!(op, "insert" | "update")
}

pub fn is_synced_table(table: &str) -> bool {
    SYNCED_TABLES.iter().any(|t| *t == table)
}

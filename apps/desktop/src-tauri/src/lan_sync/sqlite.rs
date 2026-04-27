// SQLite helpers for the LAN sync server.
//
// The server opens the same `cachink.db` file the frontend edits via
// `tauri-plugin-sql` — a single source of truth per ADR-011. We use an
// r2d2 pool so concurrent axum handlers don't serialise behind one
// connection, and we open every connection with WAL mode + `busy_timeout`
// so readers and writers coexist with the plugin.

use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::OpenFlags;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

pub type SqlitePool = Pool<SqliteConnectionManager>;

/// Resolve the on-disk path of `cachink.db`. Mirrors
/// `tauri-plugin-sql`'s resolution — `<app_data_dir>/cachink.db`.
pub fn resolve_cachink_db(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir: {e}"))?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("create data dir: {e}"))?;
    Ok(dir.join("cachink.db"))
}

/// Build an r2d2 pool pointing at the given SQLite path.
pub fn build_pool(path: &Path) -> Result<SqlitePool, String> {
    let manager = SqliteConnectionManager::file(path)
        .with_flags(OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_CREATE)
        .with_init(|conn| {
            // WAL keeps the plugin's reads unblocked while the server
            // writes pushed deltas. 5 s busy timeout is generous; axum
            // handlers shouldn't ever hit it during steady-state sync.
            conn.execute_batch(
                "PRAGMA journal_mode=WAL;
                 PRAGMA busy_timeout=5000;
                 PRAGMA foreign_keys=ON;",
            )
        });
    Pool::builder()
        .max_size(8)
        .build(manager)
        .map_err(|e| format!("build pool: {e}"))
}

/// Execute the LWW upsert for a single row. Returns `true` when the row
/// was accepted (inserted or updated), `false` when the incoming row was
/// rejected as stale per ADR-029's conflict policy.
///
/// The SQL is hand-assembled because rusqlite can't bind a variable set
/// of columns. `table` + `columns` are **validated by the caller** against
/// `protocol::is_synced_table` / a column-name allowlist so SQL injection
/// can't sneak in through `serde_json`.
pub fn upsert_lww(
    conn: &mut rusqlite::Connection,
    table: &str,
    row: &serde_json::Map<String, serde_json::Value>,
) -> Result<bool, rusqlite::Error> {
    let cols: Vec<&str> = row.keys().map(String::as_str).collect();
    let placeholders: Vec<String> = (0..cols.len()).map(|i| format!("?{}", i + 1)).collect();
    let set_clause: Vec<String> = cols
        .iter()
        .filter(|c| !matches!(**c, "id"))
        .map(|c| format!("\"{c}\" = excluded.\"{c}\""))
        .collect();
    let sql = format!(
        "INSERT INTO \"{table}\" ({col_list}) VALUES ({ph_list})
         ON CONFLICT(\"id\") DO UPDATE SET {set_list}
         WHERE excluded.\"updated_at\" > \"{table}\".\"updated_at\"
            OR (excluded.\"updated_at\" = \"{table}\".\"updated_at\"
                AND excluded.\"device_id\" < \"{table}\".\"device_id\")",
        col_list = cols.iter().map(|c| format!("\"{c}\"")).collect::<Vec<_>>().join(", "),
        ph_list = placeholders.join(", "),
        set_list = set_clause.join(", "),
    );
    let tx = conn.transaction()?;
    let changed = {
        let mut stmt = tx.prepare(&sql)?;
        let params: Vec<rusqlite::types::Value> = cols
            .iter()
            .map(|c| json_to_sqlite_value(&row[*c]))
            .collect();
        let params_refs: Vec<&dyn rusqlite::ToSql> =
            params.iter().map(|v| v as &dyn rusqlite::ToSql).collect();
        stmt.execute(params_refs.as_slice())?
    };
    tx.commit()?;
    Ok(changed > 0)
}

fn json_to_sqlite_value(v: &serde_json::Value) -> rusqlite::types::Value {
    use rusqlite::types::Value as V;
    match v {
        serde_json::Value::Null => V::Null,
        serde_json::Value::Bool(b) => V::Integer(i64::from(*b)),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                V::Integer(i)
            } else if let Some(f) = n.as_f64() {
                V::Real(f)
            } else {
                V::Text(n.to_string())
            }
        }
        serde_json::Value::String(s) => V::Text(s.clone()),
        serde_json::Value::Array(_) | serde_json::Value::Object(_) => V::Text(v.to_string()),
    }
}

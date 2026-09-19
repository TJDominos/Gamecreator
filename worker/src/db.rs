use serde_json::Value;
use worker::wasm_bindgen::JsValue;
use worker::d1::{D1Database, D1PreparedStatement};
#[cfg(not(feature = "play"))]
use worker::d1::D1Result;
use worker::{Env, Result};

pub fn database(env: &Env) -> Result<D1Database> {
    env.get_binding::<D1Database>("DB")
}

fn js_value(value: &Value) -> JsValue {
    match value {
        Value::Null => JsValue::NULL,
        Value::Bool(value) => JsValue::from_bool(*value),
        Value::Number(value) => value
            .as_f64()
            .map(JsValue::from_f64)
            .unwrap_or_else(|| JsValue::from_str(&value.to_string())),
        Value::String(value) => JsValue::from_str(value),
        other => JsValue::from_str(&other.to_string()),
    }
}

pub fn statement(db: &D1Database, sql: &str, values: &[Value]) -> Result<D1PreparedStatement> {
    let bindings: Vec<JsValue> = values.iter().map(js_value).collect();
    db.prepare(sql).bind(&bindings)
}

pub async fn first(db: &D1Database, sql: &str, values: &[Value]) -> Result<Option<Value>> {
    statement(db, sql, values)?.first::<Value>(None).await
}

#[cfg(not(feature = "play"))]
pub async fn batch(db: &D1Database, statements: Vec<D1PreparedStatement>) -> Result<Vec<D1Result>> {
    Ok(db.batch(statements).await?)
}

#[cfg(not(feature = "play"))]
pub fn changes(result: &D1Result) -> Result<usize> {
    Ok(result.meta()?.and_then(|meta| meta.changes).unwrap_or_default())
}

#[cfg(not(feature = "play"))]
pub async fn all(db: &D1Database, sql: &str, values: &[Value]) -> Result<Vec<Value>> {
    Ok(statement(db, sql, values)?.all().await?.results()?)
}

#[cfg(not(feature = "play"))]
pub async fn run(db: &D1Database, sql: &str, values: &[Value]) -> Result<()> {
    statement(db, sql, values)?.run().await?;
    Ok(())
}

#[cfg(not(feature = "play"))]
pub async fn run_changes(db: &D1Database, sql: &str, values: &[Value]) -> Result<usize> {
    let result = statement(db, sql, values)?.run().await?;
    Ok(result.meta()?.and_then(|meta| meta.changes).unwrap_or_default())
}

pub fn string(row: &Value, key: &str) -> Option<String> {
    row.get(key).and_then(Value::as_str).map(ToOwned::to_owned)
}

#[cfg(not(feature = "play"))]
pub fn integer(row: &Value, key: &str) -> i64 {
    row.get(key).and_then(Value::as_i64).unwrap_or_default()
}

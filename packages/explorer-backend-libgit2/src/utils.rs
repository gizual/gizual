use serde::Serialize;
use std::io::Write;

#[allow(dead_code)]
pub fn print_json<T: Serialize>(data: &T) {
    let result: String;

    let is_wasm = cfg!(target_family = "wasm");

    if !is_wasm {
        result = serde_json::to_string_pretty(data).unwrap();
    } else if std::env::var("PRETTY_JSON").unwrap_or_default() == "true" {
        result = serde_json::to_string_pretty(data).unwrap();
    } else {
        result = serde_json::to_string(data).unwrap();
    }

    let mut lock = std::io::stdout().lock();
    let _ = writeln!(lock, "{}", result);
    let _ = lock.flush();
}

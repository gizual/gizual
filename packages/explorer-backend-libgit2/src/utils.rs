use serde::Serialize;
use std::io::Write;

#[allow(dead_code)]
pub fn print_json<T: Serialize>(data: &T) {
    let is_wasm = cfg!(target_family = "wasm");

    let result: String = if !is_wasm || std::env::var("PRETTY_JSON").unwrap_or_default() == "true" {
        serde_json::to_string_pretty(data).unwrap()
    } else {
        serde_json::to_string(data).unwrap()
    };

    let mut lock = std::io::stdout().lock();
    let _ = writeln!(lock, "{}", result);
    let _ = lock.flush();
}

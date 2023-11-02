use serde::Serialize;
use std::io::Write;
use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;

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


pub fn get_author_id(author_name: &String, author_email: &String) -> String {
    let mut s = DefaultHasher::new();
    author_name.hash(&mut s);
    author_email.hash(&mut s);

    // to hex string
    let author_id = format!("{:x}", s.finish());
    author_id
}


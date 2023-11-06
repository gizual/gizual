use std::io::{BufRead, Write};

use serde::{Deserialize, Serialize};
use serde_json::Error;

pub enum Connector {
    Stdout(StdoutConnector),
    #[allow(dead_code)]
    Tauri(TauriConnector),
}

impl Connector {
    pub fn read<T: for<'a> Deserialize<'a>>(&self) -> Option<Result<T, Error>> {
        match self {
            Connector::Stdout(stdout) => stdout.read(),
            Connector::Tauri(tauri) => tauri.read(),
        }
    }

    pub fn write<T: Serialize>(&self, data: &T) {
        match self {
            Connector::Stdout(stdout) => stdout.write(data),
            Connector::Tauri(tauri) => tauri.write(data),
        }
    }
}

pub struct StdoutConnector {}
pub struct TauriConnector {}

impl StdoutConnector {
    pub fn new() -> Self {
        StdoutConnector {}
    }

    fn read<T: for<'a> Deserialize<'a>>(&self) -> Option<Result<T, Error>> {
        let stdin = std::io::stdin();
        let line = stdin.lock().lines().next();

        if line.is_none() {
            return None;
        }

        let line = line.unwrap();

        if line.is_err() {
            panic!("Failed to read from stdin: {}", line.err().unwrap());
        }
        let line = line.unwrap();

        let result = serde_json::from_str::<T>(&line);

        Some(result)
    }

    fn write<T: Serialize>(&self, data: &T) -> () {
        let stdout = std::io::stdout();
        let mut handle = stdout.lock();
        // print to stdout
        let result = serde_json::to_writer(&mut handle, data);

        match result {
            Ok(_) => {}
            Err(err) => {
                panic!("Failed to write to stdout: {}", err)
            }
        }

        let result = handle.write_all(b"\n");

        match result {
            Ok(_) => {}
            Err(err) => {
                panic!("Failed to write new-line to stdout {}", err)
            }
        }
    }
}

impl TauriConnector {
    #[allow(dead_code)]
    pub fn new() -> Self {
        TauriConnector {}
    }

    fn read<T: for<'a> Deserialize<'a>>(&self) -> Option<Result<T, Error>> {
        unimplemented!();
    }

    fn write<T: Serialize>(&self, _data: &T) {
        unimplemented!();
    }
}

#![allow(non_snake_case)]
#![allow(dead_code)]

mod asyncify_exports;

use std::io::BufRead;

use explorer::{Explorer, OpenRepositoryParams, Response};

pub fn main() {
    let mut exp = Explorer::new();

    exp.cmd_open_repository(&OpenRepositoryParams {
        path: "/repo".to_owned(),
    });

    while !exp.shutdown.load(std::sync::atomic::Ordering::Relaxed) {
        let line = std::io::stdin().lock().lines().next();

        if line.is_none() {
            continue;
        }

        let line = line.unwrap();

        if line.is_err() {
            eprintln!("Failed to read from stdin: {}", line.err().unwrap());
            continue;
        }

        let line = line.unwrap();

        if line == "PING" {
            println!("PONG");
            continue;
        }

        let request = Explorer::deserialize_request(line);

        match request {
            Ok(request) => exp.handle(request, explorer_callback),
            Err(err) => {
                eprintln!("Failed to deserialize request: {}", err);
            }
        }
    }
}

fn explorer_callback(response: Response) {
    let result = Explorer::serialize_response(response);

    match result {
        Ok(result) => {
            println!("{}", result);
        }
        Err(err) => {
            panic!("Failed to write to stdout: {}", err)
        }
    }
}

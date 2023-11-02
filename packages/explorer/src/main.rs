#![allow(dead_code)]

mod authors;
mod blame;
mod branches;
mod commits;
mod file_content;
mod file_tree;
mod file_types;
mod file_types_db;
mod git_graph;
mod handler;
mod connector;
mod utils;

#[macro_use]
extern crate lazy_static;


use git2::Repository;
use std::sync::{Arc, Mutex};

use structopt::StructOpt;

#[allow(unused_imports)]
use asyncify_exports;

use crate::connector::StdoutConnector;
use crate::handler::RpcHandler;

#[derive(StructOpt)]
struct Args {
    #[structopt(name = "repo_path", long, default_value = "/repo")]
    repo_path: String,
}

fn main() {
    let args = Args::from_args();

    let repo = Repository::open(args.repo_path).unwrap();

    let locked_repo = Arc::new(Mutex::new(repo));

    let handler = RpcHandler::new(
        connector::Connector::Stdout(StdoutConnector::new()),
        locked_repo,
    );

    let initial_msg = r#"{"jsonrpc":"2.0","ready":true,"id":0}"#;

    println!("{}", initial_msg);

    handler.run();

}

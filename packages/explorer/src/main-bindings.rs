#![allow(non_snake_case)]
#![allow(dead_code)]

use specta::{ts::*, *};

mod authors;
mod blame;
mod branches;
mod commits;
mod explorer;
mod file_content;
mod file_tree;
mod file_types;
mod file_types_db;
mod git_graph;
mod utils;

#[macro_use]
extern crate lazy_static;

use structopt::StructOpt;
#[derive(StructOpt)]
struct Args {
    #[structopt(name = "output", long)]
    output: String,
}

pub fn main() {
    let args = Args::from_args();

    println!("Generating bindings...");
    match export::ts_with_cfg(
        &args.output,
        &ExportConfig::default().bigint(BigIntExportBehavior::Number),
    ) {
        Ok(_) => {
            println!("Bindings generated successfully");
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            std::process::exit(1);
        }
    }
}

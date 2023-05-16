/*
 * libgit2 "blame" example - shows how to use the blame API
 *
 * Written by the libgit2 contributors
 *
 * To the extent possible under law, the author(s) have dedicated all copyright
 * and related and neighboring rights to this software to the public domain
 * worldwide. This software is distributed without any warranty.
 *
 * You should have received a copy of the CC0 Public Domain Dedication along
 * with this software. If not, see
 * <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

#![deny(warnings)]

mod cmd_blame;
mod cmd_get_file_content;
mod cmd_get_filetree;
mod cmd_list_branches;
mod utils;

use structopt::StructOpt;

#[derive(StructOpt)]
struct Args {
    #[structopt(name = "command")]
    cmd: String,

    #[structopt(name = "branch")]
    branch_name: String,

    #[structopt(name = "path")]
    file_path: Option<String>,
}

#[link(wasm_import_module = "feedback")]
extern "C" {
    fn finished();
}

fn main() {
    let args = Args::from_args();

    let file_path = args.file_path.clone().unwrap_or_default();
    let branch_name = args.branch_name.clone();
    let command = args.cmd.clone();

    let result;
    if command == "filetree" {
        result = cmd_get_filetree::command_get_filetree(args.branch_name.as_str());
    } else if command == "blame" {
        result = cmd_blame::cmd_blame(branch_name.as_str(), file_path.as_str());
    } else if command == "file_content" {
        result =
            cmd_get_file_content::cmd_get_file_content(branch_name.as_str(), file_path.as_str());
    } else if command == "list_branches" {
        result = cmd_list_branches::cmd_list_branches();
    } else {
        result = Ok(());
    }

    if let Err(e) = result {
        println!("error: {}", e);
    }
    unsafe {
        finished();
    }
}

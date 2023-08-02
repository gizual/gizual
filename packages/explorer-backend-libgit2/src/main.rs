mod cmd_authors;
mod cmd_blame;
mod cmd_branches;
mod cmd_get_file_content;
mod cmd_get_filetree;
mod cmd_git_graph;
mod utils;

use crate::cmd_git_graph::CommitTree;
use git2::Repository;
use jsonrpc_core::*;
use jsonrpc_derive::rpc;
use std::io::BufRead;
use std::result;
use std::sync::{Arc, Mutex};

use crate::cmd_blame::{Blame, BlameParams};
use crate::cmd_branches::CommitsForBranch;
use crate::cmd_get_file_content::GetFileContentParams;
use crate::cmd_get_filetree::GetFileTreeParams;
use structopt::StructOpt;

#[allow(unused_imports)]
use asyncify_exports;

#[derive(StructOpt)]
struct Args {
    #[structopt(name = "repo_path", long, default_value = "/repo")]
    repo_path: String,
}

pub struct RpcHandler {
    repo: Arc<Mutex<Repository>>,
    shutdown_flag: Arc<Mutex<bool>>,
}

#[rpc(server)]
pub trait RpcCommands {
    #[rpc(name = "list_branches")]
    fn list_branches(&self) -> Result<Vec<String>>;

    #[rpc(name = "stream_authors")]
    fn stream_authors(&self) -> Result<bool>;

    #[rpc(name = "git_graph")]
    fn git_graph(&self) -> Result<CommitTree>;

    #[rpc(name = "file_tree")]
    fn file_tree(&self, params: GetFileTreeParams) -> Result<bool>;

    #[rpc(name = "blame")]
    fn blame(&self, params: BlameParams) -> Result<Blame>;

    #[rpc(name = "file_content")]
    fn file_content(&self, params: GetFileContentParams) -> Result<String>;

    #[rpc(name = "get_commits_for_branch")]
    fn get_commits_for_branch(&self, branch: String) -> Result<CommitsForBranch>;

    #[rpc(name = "shutdown")]
    fn shutdown(&self) -> Result<bool>;
}

impl RpcHandler {
    fn respond<T: std::fmt::Debug>(&self, data: result::Result<T, git2::Error>) -> Result<T> {
        if let Err(data) = data {
            let message = data.message();
            return Err(Error {
                code: ErrorCode::InternalError,
                message: message.to_string(),
                data: None,
            });
        }
        Ok(data.unwrap())
    }
}

impl RpcCommands for RpcHandler {
    fn list_branches(&self) -> Result<Vec<String>> {
        let repo = self.repo.lock().unwrap();
        let result = cmd_branches::list_branches(&repo);
        self.respond(result)
    }

    fn stream_authors(&self) -> Result<bool> {
        let repo = self.repo.lock().unwrap();
        let result = cmd_authors::stream_authors(&repo);
        self.respond(result)
    }

    fn git_graph(&self) -> Result<CommitTree> {
        let mut repo = self.repo.lock().unwrap();
        let result = cmd_git_graph::cmd_get_git_graph(&mut repo);
        self.respond(result)
    }

    fn file_tree(&self, params: GetFileTreeParams) -> Result<bool> {
        let repo = self.repo.lock().unwrap();
        let result = cmd_get_filetree::get_filetree(params, &repo);
        self.respond(result)
    }

    fn blame(&self, params: BlameParams) -> Result<Blame> {
        let repo = self.repo.lock().unwrap();
        let result = cmd_blame::blame(params, &repo);
        self.respond(result)
    }

    fn file_content(&self, params: GetFileContentParams) -> Result<String> {
        let repo = self.repo.lock().unwrap();
        let result = cmd_get_file_content::get_file_content(params, &repo);
        self.respond(result)
    }

    fn get_commits_for_branch(&self, branch: String) -> Result<CommitsForBranch> {
        let repo = self.repo.lock().unwrap();
        let result = cmd_branches::get_commits_for_branch(&repo, branch);
        self.respond(result)
    }

    fn shutdown(&self) -> Result<bool> {
        let mut flag = self.shutdown_flag.lock().unwrap();
        *flag = true;
        Ok(true)
    }
}

fn main() {
    let args = Args::from_args();

    let repo = Repository::open(args.repo_path).unwrap();

    let locked_repo = Arc::new(Mutex::new(repo));
    let shutdown_flag = Arc::new(Mutex::new(false));

    let mut io = IoHandler::new();
    let handler = RpcHandler {
        repo: locked_repo,
        shutdown_flag: shutdown_flag.clone(),
    };

    io.extend_with(handler.to_delegate());

    let initial_msg = r#"{"jsonrpc":"2.0","ready":true,"id":0}"#;

    let stdin = std::io::stdin();
    println!("{}", initial_msg);

    for line in stdin.lock().lines().flatten() {
        let result = io.handle_request_sync(line.as_str());
        println!("{}", result.unwrap());
        let shutdown = shutdown_flag.lock().unwrap();
        if shutdown.eq(&true) {
            break;
        }
    }
}

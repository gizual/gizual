#![allow(dead_code)]

use core::panic;
use git2::Repository;
use serde::Serialize;
use std::sync::{Arc, Mutex};

use crate::authors::StreamAuthorsParams;
use crate::blame::BlameParams;
use crate::branches::GetCommitsForBranchParams;
use crate::commits::StreamCommitsParams;
use crate::connector::Connector;
use crate::file_content::GetFileContentParams;
use crate::file_tree::GetFileTreeParams;

#[derive(Debug, serde::Deserialize, serde::Serialize)]
#[serde(tag = "method", content = "params")]
pub enum Request {
    #[serde(rename = "stream_branches")]
    StreamAuthors(StreamAuthorsParams),

    #[serde(rename = "get_file_tree")]
    GetFileTree(GetFileTreeParams),

    #[serde(rename = "get_branches")]
    GetBranchList(NoParams),

    #[serde(rename = "get_git_graph")]
    GetGitGraph(NoParams),

    #[serde(rename = "get_blame")]
    GetBlame(BlameParams),

    #[serde(rename = "get_file_content")]
    GetFileContent(GetFileContentParams),

    #[serde(rename = "get_commits_for_branch")]
    GetCommitsForBranch(GetCommitsForBranchParams),

    #[serde(rename = "stream_commits")]
    StreamCommits(StreamCommitsParams),

    #[serde(rename = "shutdown")]
    Shutdown(NoParams),
    // TODO: GetFirstCommit() ?
}

pub struct RpcHandler {
    connector: Connector,
    pub repo: Arc<Mutex<Repository>>,
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct NoParams {}

#[derive(Debug, serde::Deserialize, serde::Serialize)]

struct Response<T> {
    data: Option<T>,

    #[serde(skip_serializing_if = "Option::is_none")]
    end: Option<bool>,
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
struct ErrorResponse {
    message: String,
    error: bool,
}

pub type RequestResult = ();

impl RpcHandler {
    pub fn new(connector: Connector, repo: Arc<Mutex<Repository>>) -> RpcHandler {
        RpcHandler { connector, repo }
    }

    pub fn send<T: Serialize>(&self, data: T, end: bool) {
        let e = if end { Some(true) } else { None };

        self.connector.write(&Response {
            data: Some(data),
            end: e,
        });
    }

    pub fn send_error(&self, message: String) {
        self.connector.write(&ErrorResponse {
            message,
            error: true,
        });
    }

    pub fn run(&self) {
        let mut shutdown = false;
        while !shutdown {
            let request = self.connector.read::<Request>();

            if request.is_none() {
                continue;
            }

            let request = request.unwrap();

            let request = request.unwrap_or_else(|err| {
                panic!("Error reading request: {:?}", err);
            });

            match request {
                Request::StreamAuthors(_) => self.cmd_get_authors(),
                Request::GetFileTree(params) => self.get_file_tree(&params),
                Request::GetBranchList(_) => self.cmd_get_branches(),
                Request::GetGitGraph(_) => self.cmd_get_git_graph(),
                Request::GetBlame(params) => self.cmd_get_blame(&params),
                Request::GetFileContent(params) => self.get_file_content(&params),
                Request::GetCommitsForBranch(params) => self.cmd_get_commits_for_branch(&params),
                Request::StreamCommits(_) => self.stream_commits(),
                Request::Shutdown(_) => {
                    shutdown = true;
                }
            };
        }
    }
}

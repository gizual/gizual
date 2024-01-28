use std::sync::atomic::{AtomicBool, Ordering};

use git2::Repository;
use serde::Serialize;

#[cfg(feature = "bindings")]
use specta::Type;

use crate::authors::StreamAuthorsParams;
use crate::blame::BlameParams;
use crate::branches::GetCommitsForBranchParams;
use crate::commits::{self, GetCommitIdsForRefsParams, GetCommitIdsForTimeRangeParams, StreamCommitsParams};
use crate::file_content::GetFileContentParams;
use crate::file_tree::GetFileTreeParams;


#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct OpenRepositoryParams {
    pub path: String,
}


#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct OpenRepositoryResult {
    pub success: bool
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct InitialDataResult {
    #[serde(rename = "currentBranch")]
    pub current_branch: String,
    pub commit: commits::Commit
}


#[derive(Debug, serde::Deserialize, serde::Serialize)]
#[serde(tag = "method", content = "params")]
pub enum Request {
    #[serde(rename = "get_commit_ids_for_refs")]
    GetCommitIdsForRefs(GetCommitIdsForRefsParams),

    #[serde(rename = "get_commit_ids_for_time_range")]
    GetCommitIdsForTimeRange(GetCommitIdsForTimeRangeParams),

    #[serde(rename = "open_repository")]
    OpenRepository(OpenRepositoryParams),

    #[serde(rename = "stream_authors")]
    StreamAuthors(StreamAuthorsParams),

    #[serde(rename = "get_file_tree")]
    GetFileTree(GetFileTreeParams),

    #[serde(rename = "stream_file_tree")]
    StreamFileTree(GetFileTreeParams),

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
    
    #[serde(rename = "get_initial_data")]
    GetInitialData(NoParams),
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct NoParams {}

fn is_false(b: &bool) -> bool {
    !(*b)
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct ErrorResponse {
    error: String,
}

#[derive(Debug, serde::Serialize)]
pub struct DataResponse<T> {
    data: T,
    #[serde(skip_serializing_if = "is_false")]
    end: bool,
}

#[derive(Debug, serde::Serialize)]
#[serde(untagged)]
pub enum Response {
    Error(ErrorResponse),
    Data(DataResponse<serde_json::Value>),
}

pub type ExplorerCallback = fn(Response) -> ();

pub struct Explorer {
    pub repo: Option<Repository>,
    callback: Box<dyn Fn(Response) + Send + Sync>,
    pub shutdown: AtomicBool,
}

unsafe impl Sync for Explorer {}

impl Default for Explorer {
    fn default() -> Self {
        Self::new()
    }
}

impl Explorer {
    pub fn new() -> Explorer {
        Explorer {
            repo: None,
            shutdown: AtomicBool::new(false),
            callback: Box::new(|_| {}),
        }
    }

    pub fn set_repo(&mut self, repo: Repository) {
        self.repo.replace(repo);
    }

    pub fn send<T: Serialize>(&self, data: T, end: bool) {
        let callback = self.callback.as_ref();

        callback(Response::Data(DataResponse {
            data: serde_json::to_value(data).unwrap(),
            end
        }));
    }

    pub fn send_error(&self, message: String) {
        let callback = self.callback.as_ref();

        callback(Response::Error(ErrorResponse { error: message }));
    }

    pub fn deserialize_request(data: String) -> Result<Request, serde_json::Error> {
        serde_json::from_str(&data)
    }

    pub fn serialize_response(response: Response) -> Result<String, serde_json::Error> {
        serde_json::to_string(&response)
    }

    pub fn cmd_open_repository(&mut self, params: &OpenRepositoryParams) {
        match Repository::open(&params.path) {
            Ok(repo) => {
                self.repo.replace(repo);
                self.send(OpenRepositoryResult { success: true }, true);
            }
            Err(e) => {
                self.send_error(e.message().to_string());
            }
        };
    }

    pub fn cmd_get_initial_data(&self) {
        let repo = self.repo.as_ref().unwrap();

        // get current branch and files of last commit

        let head = repo.head().unwrap();
        let head_commit = head.peel_to_commit().unwrap();
        let head_tree = head_commit.tree().unwrap();
    
        let mut files = Vec::new();

        for entry in head_tree.iter() {
            let name = entry.name().unwrap().to_string();
            files.push(name);
        }

        let data = InitialDataResult {
            current_branch: head.shorthand().unwrap().to_string(),
            commit: commits::Commit {
                oid: head_commit.id().to_string(),
                aid: head_commit.author().email().unwrap().to_string(),
                message: head_commit.message().unwrap().to_string(),
                files,
                timestamp: head_commit.time().seconds().to_string(),
            }
        };

        self.send(&data, true);

    }

    pub fn handle(&mut self, request: Request, cb: impl Fn(Response) + Send + Sync + 'static) {
        self.callback = Box::new(cb);

        match request {
            Request::OpenRepository(params) => self.cmd_open_repository(&params),
            Request::StreamAuthors(_) => self.cmd_stream_authors(),
            Request::GetFileTree(params) => self.get_file_tree(&params),
            Request::StreamFileTree(params) => self.stream_file_tree(&params),
            Request::GetBranchList(_) => self.cmd_get_branches(),
            Request::GetGitGraph(_) => self.cmd_get_git_graph(),
            Request::GetBlame(params) => self.cmd_get_blame(&params),
            Request::GetFileContent(params) => self.get_file_content(&params),
            Request::GetCommitsForBranch(params) => self.cmd_get_commits_for_branch(&params),
            Request::StreamCommits(_) => self.cmd_stream_commits(),
            Request::GetInitialData(_) => self.cmd_get_initial_data(),
            Request::GetCommitIdsForRefs(params) => self.cmd_get_commit_ids_for_refs(params),
            Request::GetCommitIdsForTimeRange(params) => self.cmd_get_commit_ids_for_time_range(params),
            Request::Shutdown(_) => {
                self.shutdown.store(true, Ordering::Relaxed);
            }
        };

        self.callback = Box::new(|_| {});
    }
}

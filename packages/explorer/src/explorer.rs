use std::sync::atomic::{AtomicBool, Ordering};

use git2::{BranchType, Repository};
use serde::Serialize;

#[cfg(feature = "bindings")]
use specta::Type;

use crate::authors::StreamAuthorsParams;
use crate::blame::BlameParams;
use crate::branches::GetCommitsForBranchParams;
use crate::commits::{
    self, GetCommitParams, GetCommitsForTimeRangeParams, IsValidRevParams, StreamCommitsParams,
};
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
    pub success: bool,
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct Remote {
    pub name: String,
    pub url: String,
}

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct InitialDataResult {
    #[serde(rename = "currentBranch")]
    pub current_branch: String,

    #[serde(rename = "lastCommit")]
    pub last_commit: commits::Commit,

    pub remotes: Vec<Remote>,
    pub branches: Vec<String>,
    pub tags: Vec<String>,
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
#[serde(tag = "method", content = "params")]
pub enum Request {
    #[serde(rename = "get_commits_for_time_range")]
    GetCommitsForTimeRange(GetCommitsForTimeRangeParams),

    #[serde(rename = "open_repository")]
    OpenRepository(OpenRepositoryParams),

    #[serde(rename = "stream_authors")]
    StreamAuthors(StreamAuthorsParams),

    #[serde(rename = "get_authors")]
    GetAuthors(NoParams),    

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

    #[serde(rename = "is_valid_rev")]
    IsValidRev(IsValidRevParams),

    #[serde(rename = "get_commit")]
    GetCommit(GetCommitParams),
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
            end,
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
        let head_commit_id = head_commit.id().to_string();

        let remote_names = repo.remotes().unwrap();
        let remote_names: Vec<String> = remote_names
            .iter()
            .map(|r| r.unwrap().to_string())
            .collect();

        let remotes_raw: Vec<git2::Remote> = remote_names
            .iter()
            .map(|r| repo.find_remote(r).unwrap())
            .collect();

        let tags = repo.tag_names(None).unwrap();
        let tags = tags.iter().map(|t| t.unwrap().to_string()).collect();

        let branches = repo.branches(Some(BranchType::Local)).unwrap();
        let branches = branches
            .map(|b| b.unwrap())
            .map(|(b, _)| b.name().unwrap().unwrap().to_string())
            .collect();

        let mut remotes: Vec<Remote> = Vec::new();

        for remote in remotes_raw {
            let name = remote.name().unwrap().to_string();
            let url = remote.url().unwrap().to_string();

            remotes.push(Remote { name, url });
        }

        let data = InitialDataResult {
            current_branch: head.shorthand().unwrap().to_string(),
            last_commit: self.get_commit(&head_commit_id).unwrap(),
            remotes,
            branches,
            tags,
        };

        self.send(data, true);
    }

    pub fn handle(&mut self, request: Request, cb: impl Fn(Response) + Send + Sync + 'static) {
        self.callback = Box::new(cb);

        match request {
            Request::OpenRepository(params) => self.cmd_open_repository(&params),
            Request::StreamAuthors(_) => self.cmd_stream_authors(),
            Request::GetAuthors(_) => self.cmd_get_authors(),
            Request::GetFileTree(params) => self.get_file_tree(&params),
            Request::StreamFileTree(params) => self.stream_file_tree(&params),
            Request::GetBranchList(_) => self.cmd_get_branches(),
            Request::GetGitGraph(_) => self.cmd_get_git_graph(),
            Request::GetBlame(params) => self.cmd_get_blame(&params),
            Request::GetFileContent(params) => self.get_file_content(&params),
            Request::GetCommitsForBranch(params) => self.cmd_get_commits_for_branch(&params),
            Request::StreamCommits(_) => self.cmd_stream_commits(),
            Request::GetInitialData(_) => self.cmd_get_initial_data(),
            Request::GetCommitsForTimeRange(params) => self.cmd_get_commits_for_time_range(params),
            Request::IsValidRev(params) => self.cmd_is_valid_rev(&params),
            Request::GetCommit(params) => self.cmd_get_commit(&params),
            Request::Shutdown(_) => {
                self.shutdown.store(true, Ordering::Relaxed);
            }
        };

        self.callback = Box::new(|_| {});
    }
}

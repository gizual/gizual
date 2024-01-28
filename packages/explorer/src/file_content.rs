use git2::{ObjectType, Repository};
use serde::{Deserialize, Serialize};

use std::path::Path;

#[cfg(feature = "bindings")]
use specta::Type;

use crate::{commits::CommitIds, explorer::Explorer};

#[cfg_attr(feature = "bindings", derive(Type))]
#[derive(Debug, Serialize, Deserialize)]
pub struct GetFileContentParams {
    branch: String,
    path: String,
    range: CommitIds,
}

pub fn get_file_content(
    params: &GetFileContentParams,
    repo: &Repository,
) -> Result<String, git2::Error> {
    let last_commit_id = params.range.end_id.clone();

    let oid = git2::Oid::from_str(&last_commit_id)?;

    let commit: git2::Commit<'_> = repo.find_commit(oid)?;
   
    let tree = commit.tree()?;
    let path = Path::new(params.path.as_str());
    let entry = tree.get_path(path)?;

    if entry.kind() == Some(ObjectType::Blob) {
        let blob = repo.find_blob(entry.id())?;
        let content = blob.content();
        return Ok(String::from_utf8_lossy(content).to_string());
    }
    Ok("not a blob".to_string())
}

impl Explorer {
    pub fn get_file_content(&self, params: &GetFileContentParams) {
        let repo = self.repo.as_ref().unwrap();

        let result = get_file_content(params, repo);

        match result {
            Ok(content) => {
                self.send(content, true);
            }
            Err(err) => {
                self.send_error(err.message().to_string());
            }
        }
    }
}

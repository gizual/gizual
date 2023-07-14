use crate::utils;
use git2::{ObjectType, Repository};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct GetFileContentParams {
    branch: String,
    path: String,
}

pub fn get_file_content(
    params: GetFileContentParams,
    repo: &Repository,
) -> Result<String, git2::Error> {
    let br = repo.find_branch(params.branch.as_str(), git2::BranchType::Local)?;
    let commit = br.get().peel_to_commit()?;
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

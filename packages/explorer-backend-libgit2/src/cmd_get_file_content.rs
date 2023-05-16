use crate::utils;
use git2::{ObjectType, Repository};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
struct FileContent {
    content: String,
    path: String,
}

pub fn get_file_content(branch: &str, file_path: &str) -> Result<String, git2::Error> {
    let dir_path = "/repo";

    let repo = Repository::open(dir_path)?;
    let br = repo.find_branch(branch, git2::BranchType::Local)?;
    let commit = br.get().peel_to_commit()?;
    let tree = commit.tree()?;
    let path = Path::new(file_path);
    let entry = tree.get_path(path)?;

    if entry.kind() == Some(ObjectType::Blob) {
        let blob = repo.find_blob(entry.id())?;
        let content = blob.content();
        return Ok(String::from_utf8_lossy(content).to_string());
    }
    Ok("not a blob".to_string())
}

pub fn cmd_get_file_content(branch: &str, file_path: &str) -> Result<(), git2::Error> {
    let content = get_file_content(branch, file_path)?;
    let file_content = FileContent {
        content,
        path: file_path.to_string(),
    };

    utils::print_json(&file_content);
    Ok(())
}

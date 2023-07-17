use git2::{BranchType, Error, Repository};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize)]
pub struct CommitsForBranch {
    #[serde(alias = "startCommitId")]
    start_commit: String,
    #[serde(alias = "endCommitId")]
    end_commit: String,
}

pub fn list_branches(repo: &Repository) -> Result<Vec<String>, Error> {
    let mut result: Vec<String> = Vec::new();

    let branches = repo.branches(Some(BranchType::Local))?;

    branches.for_each(|branch| {
        let (branch, _) = branch.unwrap();
        let name = branch.name().unwrap().unwrap();
        result.push(name.to_string());
    });

    Ok(result)
}

pub fn get_commits_for_branch(
    repo: &Repository,
    branch: String,
) -> Result<CommitsForBranch, Error> {
    let end_commit = repo
        .find_branch(&branch, BranchType::Local)?
        .into_reference()
        .peel_to_commit()?;

    // find the first commit of the branch
    let mut revwalk = repo.revwalk()?;
    revwalk.push(end_commit.id()).unwrap();
    revwalk.set_sorting(git2::Sort::TIME | git2::Sort::REVERSE)?;

    let first_commit_id = revwalk.next().unwrap().unwrap();

    return Ok(CommitsForBranch {
        start_commit: first_commit_id.to_string(),
        end_commit: end_commit.id().to_string(),
    });
}

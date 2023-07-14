use git2::{BranchType, Error, Repository};
use std::sync::Mutex;

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

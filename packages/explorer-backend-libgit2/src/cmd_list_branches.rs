use crate::utils;
use git2::{BranchType, Repository};

pub fn cmd_list_branches() -> Result<(), git2::Error> {
    let dir_path = "/repo";

    let mut result: Vec<String> = Vec::new();

    let repo = Repository::open(dir_path)?;

    let branches = repo.branches(Some(BranchType::Local))?;

    branches.for_each(|branch| {
        let (branch, _) = branch.unwrap();
        let name = branch.name().unwrap().unwrap();
        result.push(name.to_string());
    });

    utils::print_json(&result);
    Ok(())
}

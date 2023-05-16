use crate::utils;
use git2::{ObjectType, Repository, Tree};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct FileTree {
    name: String,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    children: Vec<FileTree>,
}

fn build_file_tree(repo: &Repository, tree: &Tree, name: &str) -> FileTree {
    let mut filetree = FileTree {
        name: name.to_string(),
        children: Vec::new(),
    };

    for entry in tree.iter() {
        let entry_name = entry.name().unwrap().to_string();

        if entry.kind() == Some(ObjectType::Tree) {
            if let Some(subtree) = entry
                .to_object(repo)
                .ok()
                .and_then(|object| object.peel_to_tree().ok())
            {
                let subtree = build_file_tree(repo, &subtree, entry_name.as_str());

                filetree.children.push(subtree);
            }
        } else {
            let file = FileTree {
                name: entry_name,
                children: Vec::new(),
            };
            filetree.children.push(file);
        }
    }

    filetree
}

fn get_filetree(repo: &Repository, branch: &str) -> Result<FileTree, git2::Error> {
    let branch = repo.find_branch(branch, git2::BranchType::Local)?;
    let commit = branch.get().peel_to_commit()?;
    let tree = commit.tree()?;

    let file_tree = build_file_tree(repo, &tree, "");

    Ok(file_tree)
}

pub(crate) fn command_get_filetree(branch: &str) -> Result<(), git2::Error> {
    let dir_path = "/repo";

    let repo = Repository::open(dir_path)?;
    let file_tree = get_filetree(&repo, branch)?;

    utils::print_json(&file_tree.children);

    Ok(())
}
